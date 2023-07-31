import { Injectable, OnModuleInit } from '@nestjs/common';
import { IConsumerCreate } from './consumer.interface';
import { IbmmqConsumer } from './ibmmq.consumer';
import { MQQueueManager } from 'ibmmq';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly consumerData: IConsumerCreate;
  private connReceive: MQQueueManager;
  private consumer: IbmmqConsumer;
  constructor(config: IConsumerCreate) {
    this.consumerData = config;
    this.consumer = new IbmmqConsumer(config);
  }
  async onModuleInit() {
    this.connReceive = await this.consumer.connect();
  }
  subscribe(queue: string){
    this.consumer.subscribe(queue, this.connReceive);
  }
}
