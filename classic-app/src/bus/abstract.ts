export interface EventBus {
  send: <T>(from: string, to: string, payload: T) => Promise<void>;
  publish: <T>(from: string, payload: T) => Promise<void>;
}
