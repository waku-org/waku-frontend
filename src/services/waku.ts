import { PUBSUB_TOPIC, SUPPORTED_PUBSUB_TOPICS } from "@/constants";
import { http } from "@/utils/http";

export type Message = {
  payload: string;
  contentTopic: string;
  version: number;
  timestamp: number;
};

type EventListener = (event: CustomEvent) => void;

const SECOND = 1000;
const LOCAL_NODE = "http://127.0.0.1:8645";
const RELAY = "/relay/v1";

const buildURL = (endpoint: string) => `${LOCAL_NODE}${endpoint}`;

class Relay {
  private activePubsubTopic = SUPPORTED_PUBSUB_TOPICS[0];
  private subscribing = false;
  private readonly subscriptionsEmitter = new EventTarget();
  // only one content topic subscriptions is possible now
  private subscriptionRoutine: undefined | number;

  constructor() {}

  public addEventListener(contentTopic: string, fn: EventListener) {
    this.subscribe();
    return this.subscriptionsEmitter.addEventListener(contentTopic, fn as any);
  }

  public removeEventListener(contentTopic: string, fn: EventListener) {
    return this.subscriptionsEmitter.removeEventListener(
      contentTopic,
      fn as any
    );
  }

  private async subscribe() {
    if (this.subscriptionRoutine || this.subscribing) {
      return;
    }

    this.subscribing = true;
    try {
      await http.post(buildURL(`${RELAY}/subscriptions`), SUPPORTED_PUBSUB_TOPICS);

      this.subscriptionRoutine = window.setInterval(async () => {
        await this.fetchMessages();
      },  5 * SECOND);
    } catch (error) {
      console.error(`Failed to subscribe node any of ${SUPPORTED_PUBSUB_TOPICS}:`, error);
    }
    this.subscribing = false;
  }

  public async unsubscribe() {
    if (!this.subscriptionRoutine) {
      return;
    }

    try {
      await http.delete(buildURL(`${RELAY}/subscriptions`), [PUBSUB_TOPIC]);
    } catch (error) {
      console.error(`Failed to unsubscribe node from ${PUBSUB_TOPIC}:`, error);
    }

    clearInterval(this.subscriptionRoutine);
    this.subscriptionRoutine = undefined;
  }

  private async fetchMessages(): Promise<void> {
    const response = await http.get(
      buildURL(`${RELAY}/messages/${encodeURIComponent(this.activePubsubTopic)}`)
    );
    const body: Message[] = await response.json();

    if (!body || !body.length) {
      return;
    }

    const messagesPerContentTopic = new Map<string, Message[]>();
    body.forEach((m) => {
      const contentTopic = m.contentTopic;
      if (!contentTopic) {
        return;
      }

      let messages = messagesPerContentTopic.get(contentTopic);
      if (!messages) {
        messages = [];
      }

      messages.push(m);
      messagesPerContentTopic.set(contentTopic, messages);
    });

    Array.from(messagesPerContentTopic.entries()).forEach(([contentTopic, messages]) => {
      this.subscriptionsEmitter.dispatchEvent(
        new CustomEvent(contentTopic, { detail: messages })
      );
    });
  }

  public changeActivePubsubTopic(pubsubTopic: string) {
    this.activePubsubTopic = pubsubTopic;
  }

  public async send(pubsubTopic: string, message: Message): Promise<void> {
    await http.post(buildURL(`${RELAY}/messages/${encodeURIComponent(pubsubTopic)}`), message);
  }
}

type DebugInfoResponse = {
  enrUri: string;
  listenAddresses: string[];
}

export type DebugInfo = {
  health: string;
  version: string;
} & DebugInfoResponse;

class Debug {
  private subscribing = false;
  private readonly subscriptionsEmitter = new EventTarget();
  private subscriptionRoutine: undefined | number;

  constructor() {}

  public addEventListener(event: string, fn: EventListener) {
    this.subscribe();
    return this.subscriptionsEmitter.addEventListener(event, fn as any);
  }

  public removeEventListener(event: string, fn: EventListener) {
    return this.subscriptionsEmitter.removeEventListener(
      event,
      fn as any
    );
  }

  private async subscribe() {
    if (this.subscriptionRoutine || this.subscribing) {
      return;
    }

    this.subscribing = true;
    try {
      await this.fetchParameters();
      this.subscriptionRoutine = window.setInterval(async () => {
        await this.fetchParameters();
      },  30 * SECOND);
    } catch(error) {
      console.error("Failed to fetch debug info:", error);
    }
    this.subscribing = false;
  }

  private async unsubscribe() {
    if (!this.subscriptionRoutine) {
      return;
    }
    clearInterval(this.subscriptionRoutine);
    this.subscriptionRoutine = undefined;
  }

  private async fetchParameters(): Promise<void> {
    const health = await this.fetchHealth();
    const debug = await this.fetchDebugInfo();
    const version = await this.fetchDebugVersion();

    this.subscriptionsEmitter.dispatchEvent(
      new CustomEvent("debug", { detail: {
        health,
        version,
        ...debug,
      } })
    );
  }

  private async fetchHealth(): Promise<string> {
    const response = await http.get(buildURL(`/health`));
    return response.text();
  }

  private async fetchDebugInfo(): Promise<DebugInfoResponse> {
    const response = await http.get(buildURL(`/debug/v1/info`));
    const body: DebugInfoResponse = await response.json();
    return body;
  }

  private async fetchDebugVersion(): Promise<string> {
    const response = await http.get(buildURL(`/debug/v1/version`));
    return response.text();
  }
}

export const waku = {
  relay: new Relay(),
  debug: new Debug(),
};
