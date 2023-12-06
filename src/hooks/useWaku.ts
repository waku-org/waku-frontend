import React from "react";
import { CONTENT_TOPIC, PUBSUB_TOPIC } from "@/constants";
import { DebugInfo, Message, waku } from "@/services/waku";

export type MessageContent = {
  nick: string;
  text: string;
  timestamp: number;
};

export const useWaku = () => {
  const [contentTopic, setContentTopic] = React.useState<string>(CONTENT_TOPIC);
  const [pubsubTopic, setPubsubTopic] = React.useState<string>(PUBSUB_TOPIC);
  const [messages, setMessages] = React.useState<Map<string, MessageContent>>(new Map());
  const [debugInfo, setDebugInfo] = React.useState<undefined | DebugInfo>();

  React.useEffect(() => {
    const messageListener = (event: CustomEvent) => {
      const nextMessages = new Map(messages);
      const newMessages: Message[] = event.detail;

      newMessages.forEach((m) => {
        try {
          const payload = JSON.parse(atob(m.payload));

          const message: MessageContent = {
            nick: payload?.nick || "unknown",
            text: payload?.text || "empty",
            timestamp: m.timestamp || Date.now(),
          };
          nextMessages.set(`${message.nick}-${message.timestamp}-${message.text}`, message);
        } catch(error) {
          console.error("Failed to parse message:", error);
        }
      });

      setMessages(nextMessages);
    };

    waku.relay.addEventListener(contentTopic, messageListener);

    return () => {
      waku.relay.removeEventListener(contentTopic, messageListener);
    };
  }, [messages, setMessages, contentTopic]);


  React.useEffect(() => {
    const debugInfoListener = (event: CustomEvent) => {
      const debugInfo = event.detail;

      if (!debugInfo) {
        return;
      }

      setDebugInfo(debugInfo);
    };

    waku.debug.addEventListener("debug", debugInfoListener);

    return () => {
      waku.debug.removeEventListener("debug", debugInfoListener);
    };
  }, [debugInfo, setDebugInfo]);

  const onSend =
    async (nick: string, text: string) => {
      const timestamp = Date.now();
      await waku.relay.send(pubsubTopic, {
        version: 0,
        timestamp,
        contentTopic,
        payload: btoa(JSON.stringify({
          nick,
          text
        })),
      });
      const id = `${nick}-${timestamp}-${text}`;
      setMessages((prev) => {
        if (prev.has(id)) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, { nick, timestamp, text });
        return next;
      });
    };

  const onContentTopicChange = async (nextContentTopic: string) => {
    if (nextContentTopic === contentTopic) {
      return;
    }

    setContentTopic(nextContentTopic);
  };

  const onPubsubTopicChange = async (nextPubsubTopic: string) => {
    if (nextPubsubTopic === pubsubTopic) {
      return;
    }

    setPubsubTopic(nextPubsubTopic);
    waku.relay.changeActivePubsubTopic(nextPubsubTopic);
  };

  return {
    onSend,
    debugInfo,
    contentTopic,
    onContentTopicChange,
    pubsubTopic,
    onPubsubTopicChange,
    messages: Array.from(messages.values()),
  };
};
