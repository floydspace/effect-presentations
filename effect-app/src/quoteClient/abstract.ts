import { Cause, Context, Effect } from "effect";
import { Quote } from "../store";

export interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<
    never,
    Cause.UnknownException | Cause.NoSuchElementException,
    Quote
  >;
}

export const QuoteClient = Context.Tag<QuoteClient>();
