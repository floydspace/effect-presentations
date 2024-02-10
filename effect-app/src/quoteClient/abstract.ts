import { Cause, Context, Effect } from "effect";
import { Quote } from "../store";
import { FetchError } from "./helper";

export interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<Quote, FetchError | Cause.NoSuchElementException>;
}

export const QuoteClient = Context.GenericTag<QuoteClient>(
  "@effect-app/QuoteClient"
);
