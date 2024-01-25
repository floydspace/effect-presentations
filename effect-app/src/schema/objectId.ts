import { Arbitrary, ParseResult, Schema } from "@effect/schema";
import { pipe } from "effect";
import { ObjectId } from "mongodb";

export const ObjectIdFromSelf = pipe(
  Schema.instanceOf(ObjectId),
  Schema.annotations({
    [Arbitrary.ArbitraryHookId]: (): Arbitrary.Arbitrary<ObjectId> => (fc) =>
      fc
        .hexaString({ minLength: 24, maxLength: 24 })
        .map((hex) => new ObjectId(hex)),
  })
);

export const ObjectIdFromString = Schema.transformOrFail(
  Schema.union(Schema.string, Schema.number),
  ObjectIdFromSelf,
  (s, _, ast) => {
    try {
      return ParseResult.succeed(new ObjectId(s));
    } catch (e: any) {
      return ParseResult.fail(ParseResult.type(ast, s, e.message));
    }
  },
  (u, _, ast) => {
    try {
      return ParseResult.succeed(u.toHexString());
    } catch (e: any) {
      return ParseResult.fail(ParseResult.type(ast, u, e.message));
    }
  }
);
