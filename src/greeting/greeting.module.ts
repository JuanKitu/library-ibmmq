import { Global, Module } from '@nestjs/common';
import { GreetingService } from './services/greeting.service';
import { STARTER_CONFIG } from '../constants/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GreetingService,
    {
      provide: STARTER_CONFIG,
      useFactory: async (configService: ConfigService) => configService.get('config'),
      inject: [ConfigService],
    }],
  exports: [GreetingService, STARTER_CONFIG],
})
export class GreetingModule {}
