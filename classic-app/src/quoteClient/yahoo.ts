import { z } from "zod";
import { QuoteClient } from "./abstract";

const quoteSchema = z
  .object({
    close: z.array(z.number()),
    high: z.array(z.number()),
    low: z.array(z.number()),
    open: z.array(z.number()),
    volume: z.array(z.number()),
  })
  .transform((value) => ({
    close: value.close[0],
    high: value.high[0],
    low: value.low[0],
    open: value.open[0],
    volume: value.volume[0],
  }));

const chartResultSchema = z
  .object({
    indicators: z.object({ quote: z.array(quoteSchema) }),
    timestamp: z.array(z.number()),
  })
  .transform((value) =>
    value.timestamp.length
      ? {
          timestamp: value.timestamp[0],
          close: value.indicators.quote[0].close,
          high: value.indicators.quote[0].high,
          low: value.indicators.quote[0].low,
          open: value.indicators.quote[0].open,
          volume: value.indicators.quote[0].volume,
        }
      : null
  );

const responseSchema = z
  .object({ chart: z.object({ result: z.array(chartResultSchema) }) })
  .transform((value) => value.chart.result[0]);

const baseUrl = "https://query2.finance.yahoo.com/v8";

export class YahooQuoteClient implements QuoteClient {
  async lastPrice(symbol: string) {
    const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return responseSchema.parse(json);
  }
}
