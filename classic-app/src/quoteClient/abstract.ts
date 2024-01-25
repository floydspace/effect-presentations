import { Quote } from "../store";

export interface QuoteClient {
  lastPrice: (symbol: string) => Promise<Quote | null>;
}
