import { Cause, Context, Effect } from "effect";
import { Quote } from "../store";
import { FetchError } from "./helper";

export interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | Cause.NoSuchElementException, Quote>;
}

export const QuoteClient = Context.Tag<QuoteClient>();
