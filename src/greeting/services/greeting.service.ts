import { Inject, Injectable } from '@nestjs/common';
import { STARTER_CONFIG } from '../../constants/constants';

@Injectable()
export class GreetingService {
  constructor( @Inject(STARTER_CONFIG) private readonly config) {
    console.log('Esta es mi configuración: ',this.config);
  }
  getHello(): string {
    return '¡Hello from the new package!';
  }
}
