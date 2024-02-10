import { ParseResult, Schema } from "@effect/schema";
import { Cause, Context, Effect } from "effect";

export const Quote = Schema.struct({
  timestamp: Schema.number,
  close: Schema.number,
  high: Schema.number,
  low: Schema.number,
  open: Schema.number,
  volume: Schema.number,
});
export type Quote = Schema.Schema.To<typeof Quote>;

export const InstrumentDocument = Schema.struct({
  id: Schema.string,
  symbol: Schema.string,
  name: Schema.string,
  isin: Schema.string,
  quote: Quote,
  deleted_at: Schema.optional(Schema.nullable(Schema.string)),
});
export type InstrumentDocument = Schema.Schema.To<typeof InstrumentDocument>;

export interface InstrumentStore {
  getById: (
    id: string
  ) => Effect.Effect<
    InstrumentDocument,
    | Cause.UnknownException
    | Cause.NoSuchElementException
    | ParseResult.ParseError
  >;
  updateQuote: (
    id: string,
    quote: Quote
  ) => Effect.Effect<void, Cause.UnknownException | ParseResult.ParseError>;
}

export const InstrumentStore = Context.GenericTag<InstrumentStore>(
  "@effect-app/InstrumentStore"
);
