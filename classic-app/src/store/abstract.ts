import { z } from "zod";

export const Quote = z.object({
  timestamp: z.number(),
  close: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  volume: z.number(),
});
export type Quote = z.infer<typeof Quote>;

export const InstrumentDocument = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  isin: z.string(),
  quote: Quote,
  deleted_at: z.string().nullable().optional(),
});
export type InstrumentDocument = z.infer<typeof InstrumentDocument>;

export interface InstrumentStore {
  getById: (id: string) => Promise<InstrumentDocument>;
  updateQuote: (id: string, quote: Quote) => Promise<void>;
}
