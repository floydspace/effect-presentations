import { Schema } from "@effect/schema";
import { Config, Context, Effect, Layer } from "effect";
import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { ObjectIdFromString } from "../schema";
import { InstrumentStore } from "./abstract";

export const DatabaseTag = Context.GenericTag<Db>("@effect-app/Database");

export const mongoDbConnect = (
  mongodbUrl: string,
  options?: MongoClientOptions
) =>
  Effect.gen(function* (_) {
    yield* _(Effect.logInfo("Connecting to MongoDB"));
    const client = yield* _(
      Effect.tryPromise(() => MongoClient.connect(mongodbUrl, options))
    );
    yield* _(Effect.logInfo("Connected to MongoDB"));
    return client;
  });

export const mongoDbClose = (force?: boolean) => (client: MongoClient) =>
  Effect.gen(function* (_) {
    yield* _(Effect.logInfo("Closing MongoDB connection"));
    yield* _(Effect.promise(() => client.close(force)));
    yield* _(Effect.logInfo("MongoDB connection closed"));
  });

export const mongoDbImpl = (mongodbUrl: string, options?: MongoClientOptions) =>
  Effect.acquireRelease(
    mongoDbConnect(mongodbUrl, options),
    mongoDbClose()
  ).pipe(Effect.andThen((client) => Effect.try(() => client.db())));

export const MongoDbLayer = Layer.scoped(
  DatabaseTag,
  Config.string("MONGODB_URL").pipe(Effect.andThen(mongoDbImpl))
);

const InstrumentStoreLayer = Layer.effect(
  InstrumentStore,
  Effect.gen(function* (_) {
    const db = yield* _(DatabaseTag);

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.andThen((_id) =>
          Effect.tryPromise(() =>
            db
              .collection("instruments")
              .findOneAndUpdate({ _id }, { $set: { quote } })
          )
        ),
        Effect.asUnit
      );

    return InstrumentStore.of({
      updateQuote,
    });
  })
);

export const MongoDbInstrumentStoreImpl = Layer.provide(
  InstrumentStoreLayer,
  MongoDbLayer
);
