import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { IProducer } from './producer.interface';
import { IbmmqProducer } from './ibmmq.producer';

@Injectable()
export class ProducerService implements OnApplicationShutdown {
  private readonly producers = new Map<string, IProducer>();
  async getProducer(qManager: string, topic: string) {
    //topic or queue
    let producer = this.producers.get(topic);
    if (!producer) {
      producer = new IbmmqProducer(qManager, topic);
      await producer.connect();
      this.producers.set(topic, producer);
    }
    return producer;
  }
  async produce(qManager: string, topic: string, message: string) {
    const producer = await this.getProducer(qManager, topic);
    await producer.produce(message);
  }
  async onApplicationShutdown(signal?: string) {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }
  }
}
