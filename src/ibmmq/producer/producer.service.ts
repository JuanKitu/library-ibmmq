import { Logger } from '@nestjs/common';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { IProducer } from './producer.interface';
import { IbmmqProducer } from './ibmmq.producer';
import { IIbmmqCreate } from '../interface/ibmmq.interface';
import * as console from 'console';

@Injectable()
export class ProducerService implements OnApplicationShutdown {
  private readonly producerData: IIbmmqCreate;
  private readonly logger: Logger;
  constructor(config: IIbmmqCreate) {
    this.producerData = config;
    this.logger = new Logger(config.channelName);
  }
  private readonly producers = new Map<string, IProducer>();
  async getProducer(qManager: string, topic: string) {
    //topic or queue
    let producer = this.producers.get(topic);
    if (!producer) {
      producer = new IbmmqProducer({ ...this.producerData, qManager, qName: topic });
      await producer.connect();
      this.producers.set(topic, producer);
    }
    return producer;
  }
  async produce(qManager: string, topic: string, message: string) {
    const producer = await this.getProducer(qManager, topic);
    await producer.produce(message);
    this.logger.log(
      `Sending message to queue {0} - Message: {1} | {NodeJS}-{${qManager}}-{${topic}}-{Thread-id}`,
    );
  }
  async onApplicationShutdown(signal?: string) {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }
  }
}
