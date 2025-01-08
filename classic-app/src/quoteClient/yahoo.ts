import { QuoteClient } from "./abstract";
import { responseSchema } from "./schema";

const baseUrl = "https://query2.finance.yahoo.com/v8";

export class YahooQuoteClient implements QuoteClient {
  async lastPrice(symbol: string) {
    const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return responseSchema.parse(json);
  }
}
