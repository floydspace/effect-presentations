import { DynamoDBDocumentService } from "@effect-aws/lib-dynamodb";
import { Cause, Config, Effect, Layer } from "effect";
import { InstrumentStore } from "./abstract";

export const DynamoDbInstrumentStoreLive = Layer.effect(
  InstrumentStore,
  Effect.gen(function* () {
    const TableName = yield* Config.string("INSTRUMENTS_TABLE_NAME");
    const db = yield* DynamoDBDocumentService;

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
          Effect.asVoid
        );

    return InstrumentStore.of({ updateQuote });
  })
).pipe(Layer.provide(DynamoDBDocumentService.defaultLayer));
