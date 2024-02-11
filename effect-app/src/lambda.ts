import { EffectHandler } from "@effect-aws/lambda";
import { Schema } from "@effect/schema";
import type { SNSEvent } from "aws-lambda";
import { Console, Effect } from "effect";
import { EventBus } from "./bus";
import { QuoteClient } from "./quoteClient";
import { InstrumentStore } from "./store";

export const effectHandler: EffectHandler<
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore
> = (event) =>
  Effect.gen(function* (_) {
    yield* _(Console.log(`Received event: `, event));

    const decodeMessage = Schema.decode(
      Schema.parseJson(Schema.struct({ symbol: Schema.string }))
    );
    const { symbol } = yield* _(decodeMessage(event.Records[0].Sns.Message));

    const bus = yield* _(EventBus);
    const client = yield* _(QuoteClient);
    const store = yield* _(InstrumentStore);

    const quote = yield* _(client.lastPrice(symbol));

    if (!quote) {
      yield* _(Effect.fail(new Error("No quote found")));
      return;
    }

    yield* _(store.updateQuote(symbol, quote));
    yield* _(bus.publish("quote_updated", { symbol, quote }));

    yield* _(Console.log(`Successfully processed event`));
  }).pipe(Effect.orDie);
