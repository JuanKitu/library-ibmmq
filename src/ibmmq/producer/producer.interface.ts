import { MQQueueManager } from 'ibmmq';

export interface IProducer {
  connect: () => Promise<MQQueueManager>;
  disconnect: () => Promise<void>;
  produce: (message: any, queue: string, conn: MQQueueManager) => Promise<string>;
}
