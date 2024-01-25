import {
  DynamoDB,
  type GetItemCommandInput,
  type GetItemCommandOutput,
  type UpdateItemCommandInput,
  type UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { Schema } from "@effect/schema";
import { Cause, Config, Context, Effect, Layer } from "effect";
import { Marshaller } from "../schema";
import { InstrumentDocument, InstrumentStore } from "./abstract";

interface DynamoDBService {
  getItem: (
    params: GetItemCommandInput
  ) => Effect.Effect<never, Cause.UnknownException, GetItemCommandOutput>;
  updateItem: (
    params: UpdateItemCommandInput
  ) => Effect.Effect<never, Cause.UnknownException, UpdateItemCommandOutput>;
}

const DynamoDBService = Context.Tag<DynamoDBService>();

const DynamoDBServiceLayer = Layer.effect(
  DynamoDBService,
  Effect.gen(function* (_) {
    const ddb = yield* _(Effect.try(() => new DynamoDB()));

    return DynamoDBService.of({
      getItem: (params) => Effect.tryPromise(() => ddb.getItem(params)),
      updateItem: (params) => Effect.tryPromise(() => ddb.updateItem(params)),
    });
  })
);

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
        )
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
  DynamoDBServiceLayer
);
