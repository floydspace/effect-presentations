import { ParseResult, Schema } from "@effect/schema";
import { Cause, Context, Effect } from "effect";

export class Quote extends Schema.Class<Quote>()({
  timestamp: Schema.number,
  close: Schema.number,
  high: Schema.number,
  low: Schema.number,
  open: Schema.number,
  volume: Schema.number,
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
