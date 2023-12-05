"use client";
import { Header } from "@/app/components/Header";
import { Waku } from "@/app/components/Waku";
import { useWaku } from "@/hooks";
import { DebugInfo } from "@/services/waku";

export default function Home() {
  const {
    onSend,
    messages,
    debugInfo,
    contentTopic,
    onContentTopicChange,
    pubsubTopic,
    onPubsubTopicChange
  } = useWaku();

  return (
    <main className="flex min-h-screen flex-col p-6 font-mono max-w-screen-lg">
      <Header>
        <DebugInfo value={debugInfo} />
      </Header>
      <Waku
        onSend={onSend}
        messages={messages}
        activeContentTopic={contentTopic}
        onActiveContentTopicChange={onContentTopicChange}
        activePubsubTopic={pubsubTopic}
        onActivePubsubTopicChange={onPubsubTopicChange}
      />
    </main>
  );
}

type DebugInfoProps = {
  value?: DebugInfo;
}

const DebugInfo: React.FunctionComponent<DebugInfoProps> = (props) => {
  if (!props.value) {
    return;
  }

  return (
    <details className="border rounded p-2">
      <summary className="cursor-pointer bg-gray-300 p-2 rounded-md">
        <span className="font-bold">Show node info</span>
      </summary>
      <div className="mt-2 text-sm break-words">
        <p className="mb-2">Health: {props.value.health}</p>
        <p className="mb-2">Version: {props.value.version}</p>
        <p className="mb-2">ENR URI: {props.value.enrUri}</p>
        <p className="mb-2">Listen Addresses:</p>
        <ul>
          {props.value.listenAddresses.map((address, index) => (
            <li key={index}>{address}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
