import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { IConsumer, IConsumerCreate } from './consumer.interface';
import { IbmmqConsumer } from './ibmmq.consumer';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly consumers: IConsumer[] = [];
  private readonly consumerData: IConsumerCreate;
  constructor(config: IConsumerCreate) {
    this.consumerData = config;
  }
  async consume(qManager: string, qName: string, waitInterval: number) {
    const consumer = new IbmmqConsumer({ ...this.consumerData, qManager, qName, waitInterval });
    await consumer.connect();
    const messages: string[] = await consumer.consume();
    this.consumers.push(consumer);
    return messages;
  }
  async onApplicationShutdown(signal?: string) {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
