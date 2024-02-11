import { makeLambda } from "@effect-aws/lambda";
import { Layer } from "effect";
import { SNSEventBusImpl } from "./bus";
import { effectHandler } from "./lambda";
import { YahooQuoteClientImpl } from "./quoteClient";
import { MongoDbInstrumentStoreImpl } from "./store";

const LambdaLive = Layer.mergeAll(
  SNSEventBusImpl,
  YahooQuoteClientImpl,
  MongoDbInstrumentStoreImpl
);

module.exports.handler = makeLambda(effectHandler, LambdaLive);
