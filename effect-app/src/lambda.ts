import { EffectHandler } from "@effect-aws/lambda";
import type { SNSEvent } from "aws-lambda";
import { Effect, Schema } from "effect";
import { EventBus } from "./bus";
import { QuoteClient } from "./quoteClient";
import { InstrumentStore } from "./store";

export const effectHandler: EffectHandler<
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore
> = (event) =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Received event: `, event);

    const decodeMessage = Schema.decode(
      Schema.parseJson(Schema.Struct({ symbol: Schema.String }))
    );
    const { symbol } = yield* decodeMessage(event.Records[0].Sns.Message);

    const bus = yield* EventBus;
    const client = yield* QuoteClient;
    const store = yield* InstrumentStore;

    const quote = yield* client.lastPrice(symbol);

    if (!quote) {
      return yield* Effect.logError("No quote found");
    }

    yield* store.updateQuote(symbol, quote);
    yield* bus.publish("quote_updated", { symbol, quote });

    yield* Effect.logInfo(`Successfully processed event`);
  }).pipe(Effect.orDie);
