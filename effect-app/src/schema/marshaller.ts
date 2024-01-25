import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ParseResult, Schema } from "@effect/schema";

export const marshaller = <I, A extends Record<string, AttributeValue>>(
  self: Schema.Schema<I, A>,
  options?: {
    unmarshall?: Parameters<typeof unmarshall>[1];
    marshall?: Parameters<typeof marshall>[1];
  }
): Schema.Schema<I, Record<string, unknown>> => {
  return Schema.transformOrFail(
    self,
    Schema.record(Schema.string, Schema.unknown),
    (s, _, ast) => {
      try {
        return ParseResult.succeed<Record<string, unknown>>(
          unmarshall(s, options?.unmarshall)
        );
      } catch (e: any) {
        return ParseResult.fail(ParseResult.type(ast, s, e.message));
      }
    },
    (u, _, ast) => {
      try {
        return ParseResult.succeed(marshall(u, options?.marshall));
      } catch (e: any) {
        return ParseResult.fail(ParseResult.type(ast, u, e.message));
      }
    },
    { strict: false }
  );
};

export const Marshaller: Schema.Schema<
  Record<string, AttributeValue>,
  Record<string, unknown>
> = marshaller(Schema.record(Schema.string, Schema.any));
