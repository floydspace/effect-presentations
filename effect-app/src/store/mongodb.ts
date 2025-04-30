import "aws4"; // This is needed for connecting to MongoDB with MONGODB-AWS auth mechanism
import { Config, Effect, Layer, Schema } from "effect";
import { MongoClient, MongoClientOptions } from "mongodb";
import { InstrumentStore, Quote } from "./abstract";

export const mongoDbConnect = (
  mongodbUrl: string,
  options?: MongoClientOptions
) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Connecting to MongoDB");
    const client = yield* Effect.tryPromise(() =>
      MongoClient.connect(mongodbUrl, options)
    );
    yield* Effect.logInfo("Connected to MongoDB");
    return client;
  });

export const mongoDbClose = (force?: boolean) => (client: MongoClient) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Closing MongoDB connection");
    yield* Effect.promise(() => client.close(force));
    yield* Effect.logInfo("MongoDB connection closed");
  });

export const mongoDbImpl = (mongodbUrl: string, options?: MongoClientOptions) =>
  Effect.acquireRelease(
    mongoDbConnect(mongodbUrl, options),
    mongoDbClose()
  ).pipe(Effect.andThen((client) => client.db()));

export class MongoDbService extends Effect.Service<MongoDbService>()(
  "@effect-app/MongoDbService",
  {
    scoped: Effect.gen(function* () {
      const mongodbUrl = yield* Config.string("MONGODB_URL");
      return yield* mongoDbImpl(mongodbUrl);
    }).pipe(Effect.withSpan("MongoDbService.connection")),
  }
) {}

export const MongoDbInstrumentStoreLive = Layer.effect(
  InstrumentStore,
  Effect.gen(function* () {
    const db = yield* MongoDbService;

    const getQuote: InstrumentStore["getQuote"] = (id) =>
      Schema.decode(Schema.String)(id).pipe(
        Effect.andThen((_id) =>
          db
            .collection<{ _id: string; quote: Quote }>("instruments")
            .findOne({ _id })
        ),
        Effect.flatMap((result) => Effect.fromNullable(result?.quote)),
        Effect.withSpan("MongoDbInstrumentStoreLive.getQuote")
      );

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      Schema.decode(Schema.String)(id).pipe(
        Effect.andThen((_id) =>
          db
            .collection<{ _id: string }>("instruments")
            .updateOne({ _id }, { $set: { quote } }, { upsert: true })
        ),
        Effect.withSpan("MongoDbInstrumentStoreLive.updateQuote"),
        Effect.asVoid
      );

    return InstrumentStore.of({ getQuote, updateQuote });
  })
).pipe(Layer.provide(MongoDbService.Default));
