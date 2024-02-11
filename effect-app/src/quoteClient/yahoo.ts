import { Schema } from "@effect/schema";
import { Effect, Layer } from "effect";
import { Quote } from "../store";
import { QuoteClient } from "./abstract";
import { effectfulFetch } from "./helper";

const YahooQuote = Schema.struct({
  close: Schema.array(Schema.number),
  high: Schema.array(Schema.number),
  low: Schema.array(Schema.number),
  open: Schema.array(Schema.number),
  volume: Schema.array(Schema.number),
});

const YahooChartResult = Schema.struct({
  indicators: Schema.struct({ quote: Schema.array(YahooQuote) }),
  timestamp: Schema.array(Schema.number),
});

const YahooResponse = Schema.transform(
  Schema.struct({
    chart: Schema.struct({ result: Schema.array(YahooChartResult) }),
  }),
  Quote,
  (r) => ({
    timestamp: r.chart.result[0].timestamp[0],
    close: r.chart.result[0].indicators.quote[0].close[0],
    high: r.chart.result[0].indicators.quote[0].high[0],
    low: r.chart.result[0].indicators.quote[0].low[0],
    open: r.chart.result[0].indicators.quote[0].open[0],
    volume: r.chart.result[0].indicators.quote[0].volume[0],
  }),
  (r) => ({
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
  })
);

const baseUrl = "https://query2.finance.yahoo.com/v8";

const lastPrice = (symbol: string) =>
  Effect.gen(function* (_) {
    const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
    const json = yield* _(effectfulFetch(url));
    return yield* _(Schema.decodeUnknownOption(YahooResponse)(json));
  }).pipe(
    Effect.catchTags({
      NoSuchElementException: () => Effect.succeed(null),
    })
  );

export const YahooQuoteClientImpl = Layer.succeed(
  QuoteClient,
  QuoteClient.of({ lastPrice })
);
