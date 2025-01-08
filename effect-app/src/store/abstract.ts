import { Cause, Context, Effect, ParseResult, Schema } from "effect";

export class Quote extends Schema.Class<Quote>("Quote")({
  timestamp: Schema.Number,
  close: Schema.Number,
  high: Schema.Number,
  low: Schema.Number,
  open: Schema.Number,
  volume: Schema.Number,
}) {}

export interface InstrumentStore {
  updateQuote: (
    id: string,
    quote: Quote
  ) => Effect.Effect<void, Cause.UnknownException | ParseResult.ParseError>;
}

export const InstrumentStore = Context.GenericTag<InstrumentStore>(
  "@effect-app/InstrumentStore"
);
