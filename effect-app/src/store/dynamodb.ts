import {
  DefaultDynamoDBDocumentServiceLayer,
  DynamoDBDocumentService,
} from "@effect-aws/lib-dynamodb";
import { Cause, Config, Effect, Layer } from "effect";
import { InstrumentStore } from "./abstract";

const InstrumentStoreLayer = Layer.effect(
  InstrumentStore,
  Effect.gen(function* (_) {
    const TableName = yield* _(Config.string("INSTRUMENTS_TABLE_NAME"));
    const db = yield* _(DynamoDBDocumentService);

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      db
        .update({
          TableName,
          Key: { id },
          UpdateExpression: "SET #quote = :quote",
          ExpressionAttributeNames: { "#quote": "quote" },
          ExpressionAttributeValues: { ":quote": { M: quote } },
        })
        .pipe(
          Effect.catchAll((e) => new Cause.UnknownException(e)),
          Effect.asUnit
        );

    return InstrumentStore.of({
      updateQuote,
    });
  })
);

export const DynamoDbInstrumentStoreImpl = Layer.provide(
  InstrumentStoreLayer,
  DefaultDynamoDBDocumentServiceLayer
);
