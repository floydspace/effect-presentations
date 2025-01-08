import { Config, Effect, Layer, Schema } from "effect";
import { MongoClient, MongoClientOptions } from "mongodb";
import { ObjectIdFromString } from "../schema";
import { InstrumentStore } from "./abstract";

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
  "app/MongoDbService",
  {
    scoped: Effect.gen(function* () {
      const mongodbUrl = yield* Config.string("MONGODB_URL");
      return yield* mongoDbImpl(mongodbUrl);
    }),
  }
) {}

export const MongoDbInstrumentStoreLive = Layer.effect(
  InstrumentStore,
  Effect.gen(function* () {
    const db = yield* MongoDbService;

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.andThen((_id) =>
          db
            .collection("instruments")
            .findOneAndUpdate({ _id }, { $set: { quote } })
        ),
        Effect.asVoid
      );

    return InstrumentStore.of({ updateQuote });
  })
).pipe(Layer.provide(MongoDbService.Default));
