export interface IConsumer {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  consume: () => Promise<string[]>;
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
}
