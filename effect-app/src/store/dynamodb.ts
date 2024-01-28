import {
  DefaultDynamoDBServiceLayer,
  DynamoDBService,
} from "@effect-aws/client-dynamodb";
import { Schema } from "@effect/schema";
import { Cause, Config, Effect, Layer } from "effect";
import { Marshaller } from "../schema";
import { InstrumentDocument, InstrumentStore } from "./abstract";

const InstrumentStoreLayer = Layer.effect(
  InstrumentStore,
  Effect.gen(function* (_) {
    const TableName = yield* _(Config.string("INSTRUMENTS_TABLE_NAME"));
    const db = yield* _(DynamoDBService);

    const getById: InstrumentStore["getById"] = (id) =>
      Schema.encode(Marshaller)({ id }).pipe(
        Effect.flatMap((Key) => db.getItem({ TableName, Key })),
        Effect.flatMap((response) => Effect.fromNullable(response.Item)),
        Effect.flatMap(
          Schema.parse(Marshaller.pipe(Schema.compose(InstrumentDocument)))
        ),
        Effect.catchAll((e) => new Cause.UnknownException(e))
      );

    const updateQuote: InstrumentStore["updateQuote"] = (id, q) =>
      Schema.encode(Schema.struct({ key: Marshaller, quote: Marshaller }))({
        key: { id },
        quote: q,
      }).pipe(
        Effect.flatMap(({ key, quote }) =>
          db.updateItem({
            TableName,
            Key: key,
            UpdateExpression: "SET #quote = :quote",
            ExpressionAttributeNames: { "#quote": "quote" },
            ExpressionAttributeValues: { ":quote": { M: quote } },
          })
        ),
        Effect.catchAll((e) => new Cause.UnknownException(e)),
        Effect.asUnit
      );

    return InstrumentStore.of({
      getById,
      updateQuote,
    });
  })
);

export const DynamoDbInstrumentStoreImpl = Layer.provide(
  InstrumentStoreLayer,
  DefaultDynamoDBServiceLayer
);
