import { LambdaHandler } from "@effect-aws/lambda";
import { Logger } from "@effect-aws/powertools-logger";
import { Tracer } from "@effect-aws/powertools-tracer";
import { Duration, Effect, Layer, Schedule, Stream } from "effect";
import { InstrumentStore, MongoDbInstrumentStoreLive } from "./store";

const PowerToolsLive = Layer.merge(
  Logger.layer({ serviceName: "effect-app" }),
  Tracer.layer({ serviceName: "effect-app" })
);

const LambdaLive = MongoDbInstrumentStoreLive.pipe(
  Layer.provideMerge(PowerToolsLive)
);

const streamHandler = () =>
  Effect.gen(function* () {
    const store = yield* InstrumentStore;
    return Stream.make("AAPL", "PLTR", "TSLA", "AMZN").pipe(
      Stream.schedule(Schedule.spaced(Duration.millis(100))),
      Stream.tap((el) => Effect.logInfo(`Stream element: ${el}`)),
      Stream.mapEffect((el) => store.getQuote(el)),
      Stream.map((quote) => `${quote.close}\n`),
      Stream.withSpan("StreamHandler")
    );
  }).pipe(Stream.unwrap);

export const handler = LambdaHandler.stream({
  handler: streamHandler,
  layer: LambdaLive,
});
