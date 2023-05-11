import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { IConsumer } from './consumer.interface';
import { IbmmqConsumer } from './ibmmq.consumer';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly consumers: IConsumer[] = [];
  async consume(qManager: string, qName: string, waitInterval: number) {
    const consumer = new IbmmqConsumer(qManager, qName, waitInterval);
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
