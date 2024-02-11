import { EffectHandler, makeLambda } from "@effect-aws/lambda";
import { Schema } from "@effect/schema";
import type { SNSEvent } from "aws-lambda";
import { Console, Effect, Layer } from "effect";
import { EventBus, SNSEventBusImpl } from "./bus";
import { QuoteClient, YahooQuoteClientImpl } from "./quoteClient";
import { InstrumentStore, MongoDbInstrumentStoreImpl } from "./store";

const Message = Schema.struct({ instrumentId: Schema.string });

const effectHandler: EffectHandler<
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore
> = (event) =>
  Effect.gen(function* (_) {
    yield* _(Console.log(`Received event: `, event));

    const decodeMessage = Schema.decode(Schema.parseJson(Message));
    const { instrumentId } = yield* _(
      decodeMessage(event.Records[0].Sns.Message)
    );

    const bus = yield* _(EventBus);
    const client = yield* _(QuoteClient);
    const store = yield* _(InstrumentStore);

    const instrument = yield* _(store.getById(instrumentId));
    const quote = yield* _(client.lastPrice(instrument.symbol));

    if (!quote) {
      yield* _(Effect.fail(new Error("No quote found")));
      return;
    }

    yield* _(store.updateQuote(instrumentId, quote));
    yield* _(bus.publish("quote_updated", { instrumentId, quote }));

    yield* _(Console.log(`Successfully processed event`));
  }).pipe(Effect.orDie);

const LambdaLive = Layer.mergeAll(
  SNSEventBusImpl,
  YahooQuoteClientImpl,
  MongoDbInstrumentStoreImpl
);

module.exports.handler = makeLambda(effectHandler, LambdaLive);
