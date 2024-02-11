import { Cause, Context, Effect } from "effect";

export interface EventBus {
  publish: <T>(
    from: string,
    payload: T
  ) => Effect.Effect<void, Cause.UnknownException>;
}

export const EventBus = Context.GenericTag<EventBus>("@effect-app/EventBus");
