import { Schema } from "@effect/schema";
import { Config, Context, Effect, Layer, pipe } from "effect";
import { Db, MongoClient, MongoClientOptions } from "mongodb";
import { ObjectIdFromString } from "../schema";
import { InstrumentDocument, InstrumentStore } from "./abstract";

export const DatabaseTag = Context.Tag<Db>();

export const mongoDbConnect = (
  mongodbUrl: string,
  options?: MongoClientOptions
) =>
  Effect.logInfo("Connecting to MongoDB").pipe(
    Effect.flatMap(() =>
      Effect.tryPromise(() => MongoClient.connect(mongodbUrl, options))
    ),
    Effect.tap(() => Effect.logInfo("Connected to MongoDB"))
  );

export const mongoDbClose = (force?: boolean) => (client: MongoClient) =>
  Effect.logInfo("Closing MongoDB connection").pipe(
    Effect.flatMap(() => Effect.promise(() => client.close(force))),
    Effect.tap(() => Effect.logInfo("MongoDB connection closed"))
  );

export const mongoDbImpl = (mongodbUrl: string, options?: MongoClientOptions) =>
  pipe(
    Effect.acquireRelease(mongoDbConnect(mongodbUrl, options), mongoDbClose()),
    Effect.flatMap((client) => Effect.try(() => client.db()))
  );

export const MongoDbLayer = Layer.scoped(
  DatabaseTag,
  Config.string("MONGODB_URL").pipe(Effect.flatMap(mongoDbImpl))
);

const InstrumentStoreLayer = Layer.effect(
  InstrumentStore,
  Effect.gen(function* (_) {
    const db = yield* _(DatabaseTag);

    const getById: InstrumentStore["getById"] = (id) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.flatMap((_id) =>
          Effect.tryPromise(() =>
            db
              .collection<InstrumentDocument>("instruments")
              .findOne({ _id, deleted_at: null })
          )
        ),
        Effect.flatMap(Effect.fromNullable),
        Effect.flatMap(Schema.decode(InstrumentDocument))
      );

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.flatMap((_id) =>
          Effect.tryPromise(() =>
            db
              .collection("instruments")
              .findOneAndUpdate({ _id }, { $set: { quote } })
          )
        ),
        Effect.asUnit
      );

    return InstrumentStore.of({
      getById,
      updateQuote,
    });
  })
);

export const MongoDbInstrumentStoreImpl = Layer.provide(
  InstrumentStoreLayer,
  MongoDbLayer
);
