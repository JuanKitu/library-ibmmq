import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsumerService } from './consumer/consumer.service';
import { ProducerService } from './producer/producer.service';
import { IBMMqModuleOptions } from './constants/ibmmq.constant';
import { IConsumerCreate } from './consumer/consumer.interface';

@Module({})
export class IbmmqModule {
  static register(config: IConsumerCreate): DynamicModule {
    return {
      module: IbmmqModule,
      providers: [
        {
          provide: ConsumerService,
          useFactory: async () => new ConsumerService(config),
        },
        {
          provide: ProducerService,
          useFactory: async () => new ProducerService(config),
        },
      ],
      exports: [ConsumerService, ProducerService],
    };
  }
}
