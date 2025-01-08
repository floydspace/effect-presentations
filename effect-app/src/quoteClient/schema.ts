import { Schema } from "effect";
import { Quote } from "../store";

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

export const YahooResponse = Schema.transform(
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
