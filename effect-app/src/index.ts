import { LambdaHandler } from "@effect-aws/lambda";
import { Logger } from "@effect-aws/powertools-logger";
import { Tracer } from "@effect-aws/powertools-tracer";
import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";
import { SNSEventBusLive } from "./bus";
import { effectHandler } from "./lambda";
import { YahooQuoteClientLive } from "./quoteClient";
import { MongoDbInstrumentStoreLive } from "./store";

const PowerToolsLive = Layer.merge(
  Logger.layer({ serviceName: "effect-app" }),
  Tracer.layer({ serviceName: "effect-app" })
);

const LambdaLive = Layer.mergeAll(
  SNSEventBusLive,
  YahooQuoteClientLive,
  MongoDbInstrumentStoreLive
).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provideMerge(PowerToolsLive)
);

module.exports.handler = LambdaHandler.make({
  handler: effectHandler,
  layer: LambdaLive,
});
