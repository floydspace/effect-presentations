import { Effect, Layer, Schema } from "effect";
import { Quote } from "../store";
import { QuoteClient } from "./abstract";
import { effectfulFetch } from "./helper";

const YahooQuote = Schema.Struct({
  close: Schema.Array(Schema.Number),
  high: Schema.Array(Schema.Number),
  low: Schema.Array(Schema.Number),
  open: Schema.Array(Schema.Number),
  volume: Schema.Array(Schema.Number),
});

const YahooChartResult = Schema.Struct({
  indicators: Schema.Struct({ quote: Schema.Array(YahooQuote) }),
  timestamp: Schema.Array(Schema.Number),
});

const YahooResponse = Schema.transform(
  Schema.Struct({
    chart: Schema.Struct({ result: Schema.Array(YahooChartResult) }),
  }),
  Quote,
  {
    decode: (r) => ({
      timestamp: r.chart.result[0].timestamp[0],
      close: r.chart.result[0].indicators.quote[0].close[0],
      high: r.chart.result[0].indicators.quote[0].high[0],
      low: r.chart.result[0].indicators.quote[0].low[0],
      open: r.chart.result[0].indicators.quote[0].open[0],
      volume: r.chart.result[0].indicators.quote[0].volume[0],
    }),
    encode: (r) => ({
      chart: {
        result: [
          {
            indicators: {
              quote: [
                {
                  close: [r.close],
                  high: [r.high],
                  low: [r.low],
                  open: [r.open],
                  volume: [r.volume],
                },
              ],
            },
            timestamp: [r.timestamp],
          },
        ],
      },
    }),
  }
);

const baseUrl = "https://query2.finance.yahoo.com/v8";

const lastPrice = (symbol: string) =>
  Effect.gen(function* () {
    const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
    const json = yield* effectfulFetch(url);
    return yield* Schema.decodeUnknownOption(YahooResponse)(json);
  }).pipe(
    Effect.catchTags({
      NoSuchElementException: () => Effect.succeed(null),
    })
  );

export const YahooQuoteClientLive = Layer.succeed(
  QuoteClient,
  QuoteClient.of({ lastPrice })
);
