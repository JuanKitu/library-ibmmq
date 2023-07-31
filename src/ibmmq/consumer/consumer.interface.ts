import { MQQueueManager } from 'ibmmq';

export interface IConsumer {
  connect: () => Promise<MQQueueManager>;
  disconnect: () => Promise<void>;
  subscribe: (queue:string, conn: MQQueueManager) => void;
}
export interface IConsumerConnection {
  userId?: string;
  password?: string;
  connectionName?: string;
  channelName?: string;
  applName?: string;
  qManager?: string;
  qName?: string;
  waitInterval?: number;
}
export interface IConsumerCreate {
  userId?: string;
  password?: string;
  connectionName?: string;
  channelName?: string;
  applName?: string;
  qManager?: string;
}
