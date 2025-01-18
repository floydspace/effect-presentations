import { makeLambda } from "@effect-aws/lambda";
import { Layer, Logger } from "effect";
import { SNSEventBusLive } from "./bus";
import { effectHandler } from "./lambda";
import { YahooQuoteClientLive } from "./quoteClient";
import { MongoDbInstrumentStoreLive } from "./store";

const LambdaLive = Layer.mergeAll(
  SNSEventBusLive,
  YahooQuoteClientLive,
  MongoDbInstrumentStoreLive
).pipe(Layer.provideMerge(Logger.structured));

export const handler = makeLambda(effectHandler, LambdaLive);
