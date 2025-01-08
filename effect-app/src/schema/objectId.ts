import { Arbitrary, ParseResult, pipe, Schema } from "effect";
import { ObjectId } from "mongodb";

export const ObjectIdFromSelf = pipe(
  Schema.instanceOf(ObjectId),
  Schema.annotations({
    arbitrary: (): Arbitrary.LazyArbitrary<ObjectId> => (fc) =>
      fc
        .hexaString({ minLength: 24, maxLength: 24 })
        .map((hex) => new ObjectId(hex)),
  })
);

export const ObjectIdFromString = Schema.transformOrFail(
  Schema.Union(Schema.String, Schema.Number),
  ObjectIdFromSelf,
  {
    decode: (s, _, ast) => {
      try {
        return ParseResult.succeed(new ObjectId(s));
      } catch (e: any) {
        return ParseResult.fail(new ParseResult.Type(ast, s, e.message));
      }
    },
    encode: (u, _, ast) => {
      try {
        return ParseResult.succeed(u.toHexString());
      } catch (e: any) {
        return ParseResult.fail(new ParseResult.Type(ast, u, e.message));
      }
    },
  }
);
