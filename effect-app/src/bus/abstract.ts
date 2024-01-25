import { Cause, Context, Effect } from "effect";

export interface EventBus {
  send: <T>(
    from: string,
    to: string,
    payload: T,
  ) => Effect.Effect<never, Cause.UnknownException, void>;

  publish: <T>(
    from: string,
    payload: T,
  ) => Effect.Effect<never, Cause.UnknownException, void>;
}

export const EventBus = Context.Tag<EventBus>();
