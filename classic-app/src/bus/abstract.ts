export interface EventBus {
  publish: <T>(from: string, payload: T) => Promise<void>;
}
