import { Arbitrary } from "@effect/schema";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { Context, SNSEvent, SNSEventRecord } from "aws-lambda";
import { Cause, Effect, Exit, Layer } from "effect";
import * as fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../src/bus";
import { effectHandler } from "../src/lambda";
import { QuoteClient } from "../src/quoteClient";
import { InstrumentStore, Quote } from "../src/store";

const QuoteArbitrary = Arbitrary.make(Quote)(fc);

describe("effectHandler", () => {
  it("should handle the event", async () => {
    const symbol = "NN.AS";
    const event: SNSEvent = {
      Records: [
        {
          Sns: { Message: JSON.stringify({ symbol }) },
        } as SNSEventRecord,
      ],
    };
    const quoteSample = fc.sample(QuoteArbitrary, 1)[0];

    const EventBusSub = Substitute.for<EventBus>();
    const QuoteClientSub = Substitute.for<QuoteClient>();
    const InstrumentStoreSub = Substitute.for<InstrumentStore>();

    EventBusSub.publish(Arg.all()).returns(Effect.unit);
    QuoteClientSub.lastPrice(Arg.all()).returns(Effect.succeed(quoteSample));
    InstrumentStoreSub.updateQuote(Arg.all()).returns(Effect.unit);

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
    InstrumentStoreSub.received(1).updateQuote(symbol, quoteSample);
    QuoteClientSub.received(1).lastPrice(symbol);
    EventBusSub.received(1).publish("quote_updated", {
      symbol,
      quote: quoteSample,
    });
  });

  it("should fail if no quote found", async () => {
    const symbol = "NN.AS";
    const event: SNSEvent = {
      Records: [
        {
          Sns: { Message: JSON.stringify({ symbol }) },
        } as SNSEventRecord,
      ],
    };

    const mockPublish = vi.fn(() => Effect.unit);
    const mockLastPrice = vi.fn(() => Effect.succeed(null));
    const mockUpdateQuote = vi.fn(() => Effect.unit);

    const MockLambdaLive = Layer.mergeAll(
      Layer.succeed(EventBus, { publish: mockPublish }),
      Layer.succeed(QuoteClient, { lastPrice: mockLastPrice }),
      Layer.succeed(InstrumentStore, { updateQuote: mockUpdateQuote })
    );

    const response = await effectHandler(event, {} as Context).pipe(
      Effect.provide(MockLambdaLive),
      Effect.runPromiseExit
    );

    expect(Exit.isFailure(response)).toBeTruthy();
    const { cause } = response as Exit.Failure<void, never>;
    expect(Cause.isDie(cause)).toBeTruthy();
    const { defect } = cause as Cause.Die;
    expect(defect).toEqual(new Error("No quote found"));
    expect(mockLastPrice).toHaveBeenCalledTimes(1);
    expect(mockLastPrice).toHaveBeenCalledWith(symbol);
    expect(mockUpdateQuote).toHaveBeenCalledTimes(0);
    expect(mockPublish).toHaveBeenCalledTimes(0);
  });
});
