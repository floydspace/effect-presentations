import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { InstrumentStore, Quote } from "./abstract";

export class DynamoDbInstrumentStore implements InstrumentStore {
  private readonly ddb: DynamoDB;
  private readonly tableName: string;

  constructor() {
    this.ddb = new DynamoDB({});
    this.tableName = process.env.INSTRUMENTS_TABLE_NAME!;
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
