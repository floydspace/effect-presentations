import { Context, Data, Effect } from "effect";
import { Quote } from "../store";

export class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

export interface QuoteClient {
  lastPrice: (symbol: string) => Effect.Effect<Quote | null, FetchError>;
}

export const QuoteClient = Context.GenericTag<QuoteClient>(
  "@effect-app/QuoteClient"
);
