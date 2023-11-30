import React from "react";
import { CONTENT_TOPIC } from "@/constants";
import { Message, waku } from "@/services/waku";

export type MessageContent = {
  nick: string;
  text: string;
  time: string;
};

export const useWaku = () => {
  const [messages, setMessages] = React.useState<Map<string, MessageContent>>(new Map());

  React.useEffect(() => {
    const messageListener = (event: CustomEvent) => {
      const nextMessages = new Map(messages);
      const newMessages: Message[] = event.detail;

      newMessages.forEach((m) => {
        const payload = JSON.parse(atob(m.payload));

        const message = {
          nick: payload?.nick || "unknown",
          text: payload?.text || "empty",
          timestamp: m.timestamp || Date.now(),
        };
        nextMessages.set(`${message.nick}-${message.timestamp}-${message.text}`, message);
      });

      setMessages(nextMessages);
    };

    waku.relay.addEventListener(CONTENT_TOPIC, messageListener);

    return () => {
      waku.relay.removeEventListener(CONTENT_TOPIC, messageListener);
    };
  }, [messages, setMessages]);

  const onSend = React.useCallback(
    async (nick: string, text: string) => {
      const timestamp = Date.now();
      await waku.relay.send({
        version: 0,
        timestamp,
        contentTopic: CONTENT_TOPIC,
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
    },
    [setMessages]
  );

  return { onSend, messages: Array.from(messages.values()) };
};
