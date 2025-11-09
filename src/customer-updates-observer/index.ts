import {
  BucketEventNotification,
  Each,
  Message,
} from "@liquidmetal-ai/raindrop-framework";
import { Env } from './raindrop.gen';

export default class extends Each<BucketEventNotification, Env> {
  async process(message: Message<BucketEventNotification>): Promise<void> {
    console.log(JSON.stringify(message));
  }
}
