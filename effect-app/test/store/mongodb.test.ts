import { fromLayer } from "@effect-aws/lambda";
import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { ConfigProvider, Effect, Exit, Layer, Runtime } from "effect";
import { Db, MongoClient } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseTag, MongoDbLayer } from "../../src/store/mongodb";

const mockConnect = vi.spyOn(MongoClient, "connect");

const ConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([["MONGODB_URL", "mongodb://localhost:27017"]])
  )
);
const TestLayer = Layer.provide(MongoDbLayer, ConfigLayer);

describe("MongoDbLayer", () => {
  let MongoClientSub: SubstituteOf<MongoClient>;
  let DbSub: SubstituteOf<Db>;

  beforeEach(() => {
    MongoClientSub = Substitute.for<MongoClient>();
    DbSub = Substitute.for<Db>();

    MongoClientSub.db().returns(DbSub);
    MongoClientSub.close().resolves();

    mockConnect.mockReset().mockResolvedValueOnce(MongoClientSub);
  });

  it("should connect to MongoDB and close the connection automatically", async () => {
    console.log("start the program...");

    const result = await DatabaseTag.pipe(
      Effect.provide(TestLayer),
      Effect.runPromiseExit
    );

    console.log("end the program...");

    expect(Exit.isSuccess(result)).toBeTruthy();
    expect((result as Exit.Success<Db, never>).value).toBe(DbSub);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith(
      "mongodb://localhost:27017",
      undefined
    );
    MongoClientSub.received(1).db();
    MongoClientSub.received(1).close();
  });

  it("should connect to MongoDB and close the connection manually", async () => {
    console.log("start the program...");

    const result = await DatabaseTag.pipe(
      Runtime.runPromiseExit(await fromLayer(TestLayer))
    );

    console.log("end the program...");

    process.emit("SIGTERM");

    expect(Exit.isSuccess(result)).toBeTruthy();
    expect((result as Exit.Success<Db, never>).value).toBe(DbSub);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith(
      "mongodb://localhost:27017",
      undefined
    );
    MongoClientSub.received(1).db();
    MongoClientSub.received(1).close();
  });
});
