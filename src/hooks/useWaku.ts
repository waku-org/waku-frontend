import React from "react";
import { CONTENT_TOPIC } from "@/constants";
import { Message, waku } from "@/services/waku";

export type MessageContent = {
  nick: string;
  text: string;
  time: string;
};

export const useWaku = () => {
  const [messages, setMessages] = React.useState<MessageContent[]>([]);

  React.useEffect(() => {
    const messageListener = (event: CustomEvent) => {
      const messages: Message[] = event.detail;
      const parsedMessaged = messages.map((message) => {
        const time = new Date(message.timestamp);
        const payload = JSON.parse(atob(message.payload));

        return {
          nick: payload?.nick || "unknown",
          text: payload?.text || "empty",
          time: time.toDateString(),
        };
      });

      setMessages((prev) => [...prev, ...parsedMessaged]);
    };

    waku.relay.addEventListener(CONTENT_TOPIC, messageListener);

    return () => {
      waku.relay.removeEventListener(CONTENT_TOPIC, messageListener);
    };
  }, [setMessages]);

  const onSend = React.useCallback(
    async (nick: string, text: string) => {
      await waku.relay.send({
        version: 0,
        timestamp: Date.now(),
        contentTopic: CONTENT_TOPIC,
        payload: btoa(JSON.stringify({
          nick,
          text
        })),
      });
    },
    []
  );

  return { onSend, messages };
};

