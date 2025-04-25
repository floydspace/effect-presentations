import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Effect, Layer, pipe } from "effect";
import { FetchError, QuoteClient } from "./abstract";
import { YahooResponse } from "./schema";

export const YahooFinanceV8HttpClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return client.pipe(
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(
      HttpClientRequest.prependUrl("https://query2.finance.yahoo.com/v8")
    )
  );
});

export const YahooQuoteClientLive = Layer.effect(
  QuoteClient,
  Effect.gen(function* () {
    const client = yield* YahooFinanceV8HttpClient;

    const lastPrice = (symbol: string) =>
      pipe(
        client.get(`/finance/chart/${symbol}`, {
          urlParams: { interval: "1d" },
        }),
        Effect.andThen(HttpClientResponse.schemaBodyJson(YahooResponse)),
        Effect.scoped,
        Effect.catchTags({ ParseError: () => Effect.succeed(null) }),
        Effect.catchAll(
          (e) =>
            new FetchError({
              message: `Failed to fetch ${e.methodAndUrl}. Reason: ${e.message}`,
            })
        ),
        Effect.withSpan("YahooQuoteClientLive.lastPrice")
      );

    return QuoteClient.of({ lastPrice });
  })
);
