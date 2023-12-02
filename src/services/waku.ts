import { PUBSUB_TOPIC } from "@/constants";
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
  private readonly subscriptionsEmitter = new EventTarget();
  // only one content topic subscriptions is possible now
  private subscriptionRoutine: undefined | number;

  constructor() {}

  public addEventListener(contentTopic: string, fn: EventListener) {
    this.subscribe(contentTopic);
    return this.subscriptionsEmitter.addEventListener(contentTopic, fn as any);
  }

  public removeEventListener(contentTopic: string, fn: EventListener) {
    return this.subscriptionsEmitter.removeEventListener(
      contentTopic,
      fn as any
    );
  }

  private async subscribe(contentTopic: string) {
    if (this.subscriptionRoutine) {
      return;
    }

    try {
      await http.post(buildURL(`${RELAY}/subscriptions`), [PUBSUB_TOPIC]);

      this.subscriptionRoutine = window.setInterval(async () => {
        await this.fetchMessages();
      },  5 * SECOND);
    } catch (error) {
      console.error(`Failed to subscribe node ${contentTopic}:`, error);
    }
  }

  public async unsubscribe(contentTopic: string) {
    if (!this.subscriptionRoutine) {
      return;
    }

    try {
      await http.delete(buildURL(`${RELAY}/subscriptions`), [PUBSUB_TOPIC]);
    } catch (error) {
      console.error(`Failed to unsubscribe node from ${contentTopic}:`, error);
    }

    clearInterval(this.subscriptionRoutine);
  }

  private async fetchMessages(): Promise<void> {
    const response = await http.get(
      buildURL(`${RELAY}/messages/${encodeURIComponent(PUBSUB_TOPIC)}`)
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

  public async send(message: Message): Promise<void> {
    await http.post(buildURL(`${RELAY}/messages/${encodeURIComponent(PUBSUB_TOPIC)}`), message);
  }
}

export const waku = {
  relay: new Relay(),
};
