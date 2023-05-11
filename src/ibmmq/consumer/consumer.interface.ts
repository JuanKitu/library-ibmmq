export interface IConsumer {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  consume: () => Promise<string[]>;
}
