import { Db, MongoClient, ObjectId } from "mongodb";
import { InstrumentDocument, InstrumentStore, Quote } from "./abstract";

export class MongoDbInstrumentStore implements InstrumentStore {
  public static async init() {
    if (!MongoDbInstrumentStore.client) {
      MongoDbInstrumentStore.client = await MongoClient.connect(
        process.env.MONGODB_URL!
      );

      const signalHandler: NodeJS.SignalsListener = async (signal) => {
        console.log(`[runtime] ${signal} received`);
        await MongoDbInstrumentStore.client.close(true);
        console.log("[runtime] exiting");
        process.exit(0);
      };

      process.on("SIGTERM", signalHandler);
      process.on("SIGINT", signalHandler);
    }

    return new MongoDbInstrumentStore(MongoDbInstrumentStore.client);
  }

  private static client: MongoClient;

  private readonly db: Db;

  private constructor(client: MongoClient) {
    this.db = client.db();
  }

  async getById(id: string) {
    const item = await this.db
      .collection("instruments")
      .findOne({ _id: new ObjectId(id), deleted_at: null });

    if (!item) {
      throw new Error("Instrument not found");
    }

    return InstrumentDocument.parse(item);
  }

  async updateQuote(id: string, quote: Quote) {
    await this.db
      .collection("instruments")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { quote } });
  }
}
