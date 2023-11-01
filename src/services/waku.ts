import { v4 as uuid } from "uuid";
import {
  PUBSUB_TOPIC,
} from "@/constants";
import { http } from "@/utils/http";

export type Message = {
  payload: string,
  contentTopic: string,
  version: number,
  timestamp: number
};

type EventListener = (event: CustomEvent) => void;

const SECOND = 1000;
const LOCAL_NODE = "http://127.0.0.1:8645/";
const FILTER_URL = "/filter/v2/";
const LIGHT_PUSH = "/lightpush/v1/";

class Filter {
  private readonly internalEmitter = new EventTarget();
  private readonly subscriptionsEmitter = new EventTarget();

  private contentTopicToRequestID: Map<string, string> = new Map();
  private contentTopicListeners: Map<string, number> = new Map();

  // only one content topic subscriptions is possible now
  private subscriptionRoutine: undefined | number;

  constructor() {
    this.internalEmitter.addEventListener("subscribed", this.handleSubscribed.bind(this));
    this.internalEmitter.addEventListener("unsubscribed", this.handleUnsubscribed.bind(this));
  }
  
  private async handleSubscribed(_e: Event) {
      const event = _e as CustomEvent;
      const contentTopic = event.detail;
      const numberOfListeners = this.contentTopicListeners.get(contentTopic);

      // if nwaku node already subscribed to this content topic
      if (numberOfListeners) {
        this.contentTopicListeners.set(contentTopic, numberOfListeners + 1);
        return;
      }

      const requestId = uuid();
      await http.post(`${LOCAL_NODE}/${FILTER_URL}/subscriptions`, {
          requestId,
          contentFilters: [contentTopic],
          pubsubTopic: PUBSUB_TOPIC
      });

      this.subscriptionRoutine = window.setInterval(async () => {
        await this.fetchMessages();
      }, SECOND);

      this.contentTopicToRequestID.set(contentTopic, requestId);
      this.contentTopicListeners.set(contentTopic, 1);
  }

  private async handleUnsubscribed(_e: Event) {
    const event = _e as CustomEvent;
    const contentTopic = event.detail;
    const requestId = this.contentTopicToRequestID.get(contentTopic);
    const numberOfListeners = this.contentTopicListeners.get(contentTopic);

    if (!numberOfListeners || !requestId) {
      return;
    }

    if (numberOfListeners - 1 > 0) {
      this.contentTopicListeners.set(contentTopic, numberOfListeners - 1);
      return;
    }

    await http.delete(`${LOCAL_NODE}/${FILTER_URL}/subscriptions`, {
      requestId,
      contentFilters: [contentTopic],
      pubsubTopic: PUBSUB_TOPIC
    });

    clearInterval(this.subscriptionRoutine);
    this.contentTopicListeners.delete(contentTopic);
    this.contentTopicToRequestID.delete(contentTopic);
  }

  private async fetchMessages(): Promise<void> {
    const contentTopic = Object.keys(this.contentTopicListeners)[0];

    if (!contentTopic) {
      return;
    }

    const response = await http.get(`${LOCAL_NODE}/${FILTER_URL}/${encodeURIComponent(contentTopic)}`);
    const body: Message[] = await response.json();

    if (!body || !body.length) {
      return;
    }

    this.subscriptionsEmitter.dispatchEvent(
      new CustomEvent(contentTopic, { detail: body })
    );
  }

  public addEventListener(contentTopic: string, fn: EventListener) {
    this.emitSubscribedEvent(contentTopic);
    return this.subscriptionsEmitter.addEventListener(contentTopic, fn as any);
  }

  public removeEventListener(contentTopic: string, fn: EventListener) {
    this.emitUnsubscribedEvent(contentTopic);
    return this.subscriptionsEmitter.removeEventListener(contentTopic, fn as any);
  }

  private emitSubscribedEvent(contentTopic: string) {
    this.internalEmitter.dispatchEvent(new CustomEvent("subscribed", { detail: contentTopic }));
  }

  private emitUnsubscribedEvent(contentTopic: string) {
    this.internalEmitter.dispatchEvent(new CustomEvent("unsubscribed", { detail: contentTopic }));
  }
}

class LightPush {
  constructor() {}

  public async send(message: Message): Promise<void> {
    await http.post(`${LOCAL_NODE}/${LIGHT_PUSH}/message`, {
      pubsubTopic: PUBSUB_TOPIC,
      message,
    });
  }
}

export const waku = {
  filter: new Filter(),
  lightPush: new LightPush(),
};