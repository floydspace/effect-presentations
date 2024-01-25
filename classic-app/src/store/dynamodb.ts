import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { InstrumentDocument, InstrumentStore, Quote } from "./abstract";

export class DynamoDbInstrumentStore implements InstrumentStore {
  private readonly ddb: DynamoDB;
  private readonly tableName: string;

  constructor() {
    this.ddb = new DynamoDB({});
    this.tableName = process.env.INSTRUMENTS_TABLE_NAME!;
  }

  async getById(id: string) {
    const res = await this.ddb.getItem({
      TableName: this.tableName,
      Key: marshall({ id }),
    });

    if (!res.Item) {
      throw new Error("Instrument not found");
    }

    return InstrumentDocument.parse(unmarshall(res.Item));
  }

  async updateQuote(id: string, quote: Quote) {
    await this.ddb.updateItem({
      TableName: this.tableName,
      Key: marshall({ id }),
      UpdateExpression: "SET #quote = :quote",
      ExpressionAttributeNames: { "#quote": "quote" },
      ExpressionAttributeValues: { ":quote": { M: marshall(quote) } },
    });
  }
}
