import { Logger } from "@effect-aws/powertools-logger";
import { Layer } from "effect";
import { SNSEventBusLive } from "./bus";
import { effectHandler } from "./lambda";
import { YahooQuoteClientLive } from "./quoteClient";
import { MongoDbInstrumentStoreLive } from "./store";

const LambdaLive = Layer.mergeAll(
  SNSEventBusLive,
  YahooQuoteClientLive,
  MongoDbInstrumentStoreLive
).pipe(Layer.provideMerge(Logger.layer({ serviceName: "effect-app" })));

module.exports.handler = {
  handler: effectHandler,
  layer: LambdaLive,
};
