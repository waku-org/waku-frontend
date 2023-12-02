import React from "react";
import { Block, BlockTypes } from "@/components/Block";
import { Subtitle } from "@/components/Subtitle";
import { Button } from "@/components/Button";
import { MessageContent, useWaku } from "@/hooks";
import { CONTENT_TOPIC } from "@/constants";

export const Waku: React.FunctionComponent<{}> = () => {
  const { onSend, messages } = useWaku();
  const { nick, text, onNickChange, onMessageChange, resetText } = useMessage();

  const onSendClick = async () => {
    await onSend(nick, text);
    resetText();
  };

  const renderedMessages = React.useMemo(
    () => messages.map(renderMessage),
    [messages]
  );

  return (
    <Block className="mt-10 flex flex-col md:flex-row lg:flex-row">
      <Block>
        <Block>
          <Subtitle>
            Waku
          </Subtitle>
          <p className="text-sm">Content topic: {CONTENT_TOPIC}</p>
        </Block>

        <Block className="mt-4 mr-10 min-w-fit">
          <label
            htmlFor="nick-input"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your nickname
          </label>
          <input
            type="text"
            id="nick-input"
            placeholder="Choose a nickname"
            value={nick}
            onChange={onNickChange}
            className="w-96 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </Block>

        <Block className="mt-4">
          <Block className="mb-2">
            <label
              htmlFor="message-input"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Message
            </label>
            <textarea
              id="message-input"
              value={text}
              onChange={onMessageChange}
              placeholder="Text your message here"
              className="w-96 h-60 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </Block>
          <Button onClick={onSendClick}>Send</Button>
        </Block>
      </Block>

      <Block className="max-w-screen-md mt-10 md:mt-0">
        <p className="text-l mb-4">Messages</p>
        <div>
          <ul>{renderedMessages}</ul>
        </div>
      </Block>
    </Block>
  );
};

function useMessage() {
  const [nick, setNick] = React.useState<string>("");
  const [text, setText] = React.useState<string>("");

  const onNickChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setNick(e.currentTarget.value || "");
  };

  const onMessageChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setText(e.currentTarget.value || "");
  };

  const resetText = () => {
    setText("");
  };

  return {
    nick,
    text,
    resetText,
    onNickChange,
    onMessageChange,
  };
}

function renderMessage(content: MessageContent) {
  return (
    <li key={`${content.nick}-${content.timestamp}-${content.text}`} className="mb-4">
      <p>
        <span className="text-lg">{content.nick}</span>
        <span className="text-sm font-bold">
          ({(new Date(content.timestamp)).toDateString()})
        </span>
        :
      </p>
      <p className="break-words">{content.text}</p>
    </li>
  );
}
