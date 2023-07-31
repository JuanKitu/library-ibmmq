import { Logger, OnModuleInit } from '@nestjs/common';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { IbmmqProducer } from './ibmmq.producer';
import { IIbmmqCreate } from '../interface/ibmmq.interface';
import { MQQueueManager } from 'ibmmq';

@Injectable()
export class ProducerService implements OnModuleInit {
  private readonly producerData: IIbmmqCreate;
  private connSend: MQQueueManager;
  private readonly logger: Logger;
  private producer: IbmmqProducer;

  constructor(config: IIbmmqCreate) {
    console.log('valor del config XD ', config);
    this.producerData = config;
    this.logger = new Logger(config.channelName);
    this.producer = new IbmmqProducer({ ...this.producerData });
  }
  async onModuleInit() {
    this.connSend = await this.producer.connect();
  }
  async produce(message: any, queue:string){
    await this.producer.produce(message,queue, this.connSend);
    this.logger.log(`Sending message to queue {0} - Message: {1} | {NodeJS}-{${this.producerData.qManager}}-{${queue}}`);
  }
}
