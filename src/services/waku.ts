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

  private contentTopicListeners: Map<string, number> = new Map();

  // only one content topic subscriptions is possible now
  private subscriptionRoutine: undefined | number;

  constructor() {}

  public addEventListener(contentTopic: string, fn: EventListener) {
    this.handleSubscribed(contentTopic);
    return this.subscriptionsEmitter.addEventListener(contentTopic, fn as any);
  }

  public removeEventListener(contentTopic: string, fn: EventListener) {
    return this.subscriptionsEmitter.removeEventListener(
      contentTopic,
      fn as any
    );
  }

  private async handleSubscribed(contentTopic: string) {
    const numberOfListeners = this.contentTopicListeners.get(contentTopic);

    // if nwaku node already subscribed to this content topic
    if (numberOfListeners) {
      this.contentTopicListeners.set(contentTopic, numberOfListeners + 1);
      return;
    }

    try {
      await http.post(buildURL(`${RELAY}/subscriptions`), [PUBSUB_TOPIC]);

      this.subscriptionRoutine = window.setInterval(async () => {
        await this.fetchMessages();
      },  5 * SECOND);

      this.contentTopicListeners.set(contentTopic, 1);
    } catch (error) {
      console.error(`Failed to subscribe node ${contentTopic}:`, error);
    }
  }

  private async handleUnsubscribed(contentTopic: string) {
    const numberOfListeners = this.contentTopicListeners.get(contentTopic);

    if (!numberOfListeners) {
      return;
    }

    if (numberOfListeners - 1 > 0) {
      this.contentTopicListeners.set(contentTopic, numberOfListeners - 1);
      return;
    }

    try {
      await http.delete(buildURL(`${RELAY}/subscriptions`), [PUBSUB_TOPIC]);
    } catch (error) {
      console.error(`Failed to unsubscribe node from ${contentTopic}:`, error);
    }

    clearInterval(this.subscriptionRoutine);
    this.contentTopicListeners.delete(contentTopic);
  }

  private async fetchMessages(): Promise<void> {
    const contentTopic = Array.from(this.contentTopicListeners.keys())[0];

    if (!contentTopic) {
      return;
    }

    const response = await http.get(
      buildURL(`${RELAY}/messages/${encodeURIComponent(PUBSUB_TOPIC)}`)
    );
    const body: Message[] = await response.json();

    if (!body || !body.length) {
      return;
    }

    this.subscriptionsEmitter.dispatchEvent(
      new CustomEvent(contentTopic, { detail: body })
    );
  }

  public async send(message: Message): Promise<void> {
    await http.post(buildURL(`${RELAY}/messages/${encodeURIComponent(PUBSUB_TOPIC)}`), message);
  }
}

export const waku = {
  relay: new Relay(),
};
