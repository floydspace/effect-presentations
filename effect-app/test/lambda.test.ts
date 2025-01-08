import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { Context, SNSEvent, SNSEventRecord } from "aws-lambda";
import { Arbitrary, Effect, Exit, FastCheck, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { EventBus } from "../src/bus";
import { effectHandler } from "../src/lambda";
import { QuoteClient } from "../src/quoteClient";
import { InstrumentStore, Quote } from "../src/store";

const QuoteArbitrary = Arbitrary.make(Quote);

const symbol = "NN.AS";
const event: SNSEvent = {
  Records: [{ Sns: { Message: JSON.stringify({ symbol }) } } as SNSEventRecord],
};

describe("effectHandler", () => {
  let EventBusSub: SubstituteOf<EventBus>;
  let QuoteClientSub: SubstituteOf<QuoteClient>;
  let InstrumentStoreSub: SubstituteOf<InstrumentStore>;

  beforeEach(() => {
    EventBusSub = Substitute.for<EventBus>();
    QuoteClientSub = Substitute.for<QuoteClient>();
    InstrumentStoreSub = Substitute.for<InstrumentStore>();

    EventBusSub.publish(Arg.all()).returns(Effect.void);
    InstrumentStoreSub.updateQuote(Arg.all()).returns(Effect.void);
  });

  it("should handle the event", async () => {
    const quoteSample = FastCheck.sample(QuoteArbitrary, 1)[0];
    QuoteClientSub.lastPrice(Arg.all()).returns(Effect.succeed(quoteSample));

    const MockLambdaLive = Layer.mergeAll(
      Layer.succeed(EventBus, EventBusSub),
      Layer.succeed(QuoteClient, QuoteClientSub),
      Layer.succeed(InstrumentStore, InstrumentStoreSub)
    );

    const response = await effectHandler(event, {} as Context).pipe(
      Effect.provide(MockLambdaLive),
      Effect.runPromiseExit
    );

    expect(Exit.isSuccess(response)).toBeTruthy();
    QuoteClientSub.received(1).lastPrice(symbol);
    InstrumentStoreSub.received(1).updateQuote(symbol, quoteSample);
    EventBusSub.received(1).publish("quote_updated", {
      symbol,
      quote: quoteSample,
    });
  });

  it("should fail if no quote found", async () => {
    QuoteClientSub.lastPrice(Arg.all()).returns(Effect.succeed(null));

    const MockLambdaLive = Layer.mergeAll(
      Layer.succeed(EventBus, EventBusSub),
      Layer.succeed(QuoteClient, QuoteClientSub),
      Layer.succeed(InstrumentStore, InstrumentStoreSub)
    );

    const response = await effectHandler(event, {} as Context).pipe(
      Effect.provide(MockLambdaLive),
      Effect.runPromiseExit
    );

    expect(Exit.isSuccess(response)).toBeTruthy();
    QuoteClientSub.received(1).lastPrice(symbol);
    InstrumentStoreSub.didNotReceive().updateQuote(Arg.all());
    EventBusSub.didNotReceive().publish(Arg.all());
  });
});
