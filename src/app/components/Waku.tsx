import React from "react";
import { Block } from "@/components/Block";
import { Subtitle } from "@/components/Subtitle";
import { Button } from "@/components/Button";
import { MessageContent } from "@/hooks";
import { SUPPORTED_PUBSUB_TOPICS } from "@/constants";

type WakuProps = {
  onSend: (nick: string, text: string) => Promise<void>;
  activeContentTopic: string;
  activePubsubTopic: string;
  messages: MessageContent[];
  onActiveContentTopicChange: (contentTopic: string) => void;
  onActivePubsubTopicChange: (pubsubTopic: string) => void;
}

export const Waku: React.FunctionComponent<WakuProps> = (props) => {
  const {
    nick,
    text,
    onNickChange,
    onMessageChange,
    resetText,
  } = useMessage();
  const [
    contentTopic,
    onContentTopicChange,
  ] = useTopic<HTMLInputElement>(props.activeContentTopic);
  const [
    pubsubTopic,
    onPubsubTopicChange,
  ] = useTopic<HTMLSelectElement>(props.activePubsubTopic);

  const onSendClick = async () => {
    await props.onSend(nick, text);
    resetText();
  };

  const renderedMessages = React.useMemo(
    () => props.messages.map(renderMessage),
    [props.messages]
  );

  return (
    <Block className="mt-10 flex flex-col md:flex-row lg:flex-row">
      <Block>
        <Block>
          <Subtitle>Chat</Subtitle>
        </Block>

        <Block className="mt-5">
          <label
            htmlFor="pubsubTopic"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Pubsub topic
          </label>
          
          <select
            id="pubsubTopic"
            value={pubsubTopic}
            onChange={onPubsubTopicChange}
            className="w-96 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            {SUPPORTED_PUBSUB_TOPICS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <Button className="mt-1" onClick={() => { props.onActivePubsubTopicChange(pubsubTopic); }}>Change</Button>
        </Block>

        <Block className="mt-5">
          <label
            htmlFor="contentTopic"
            className="block text-sm mb-2 font-medium text-gray-900 dark:text-white"
          >
            Content topic
          </label>
          <input
            type="text"
            id="contentTopic"
            value={contentTopic}
            onChange={onContentTopicChange}
            className="w-96 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          <Button className="mt-1" onClick={() => { props.onActiveContentTopicChange(contentTopic); }}>Change</Button>
        </Block>

        <Block className="mt-4 mr-10 min-w-fit">
          <label
            htmlFor="nick"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your nickname
          </label>
          <input
            type="text"
            id="nick"
            placeholder="Choose a nickname"
            value={nick}
            onChange={onNickChange}
            className="w-96 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </Block>

        <Block className="mt-5">
          <Block className="mb-2">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Message
            </label>
            <textarea
              id="message"
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

function useTopic<T>(globalTopic: string): [string, (e: React.SyntheticEvent<T>) => void] {
  const [topic, setTopic] = React.useState<string>(globalTopic);

  React.useEffect(() => {
    setTopic(globalTopic);
  }, [globalTopic]);

  const onTopicChange = (e: React.SyntheticEvent<T>) => {
    const target = e.currentTarget as any;
    setTopic(target?.value || "");
  };

  return [
    topic,
    onTopicChange,
  ];
}

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
