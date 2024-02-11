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

export interface InstrumentStore {
  updateQuote: (id: string, quote: Quote) => Promise<void>;
}
