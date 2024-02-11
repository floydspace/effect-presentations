import { Context, Effect } from "effect";
import { Quote } from "../store";
import { FetchError } from "./helper";

export interface QuoteClient {
  lastPrice: (symbol: string) => Effect.Effect<Quote | null, FetchError>;
}

export const QuoteClient = Context.GenericTag<QuoteClient>(
  "@effect-app/QuoteClient"
);
