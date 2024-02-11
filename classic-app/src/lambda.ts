import type { Handler, SNSEvent } from "aws-lambda";
import { z } from "zod";
import { SNSEventBus } from "./bus";
import { YahooQuoteClient } from "./quoteClient";
import { MongoDbInstrumentStore } from "./store";

export const handler: Handler<SNSEvent, void> = async (event) => {
  console.info(`Received event: `, event);

  const message = JSON.parse(event.Records[0].Sns.Message);
  const { symbol } = z.object({ symbol: z.string() }).parse(message);

  const bus = new SNSEventBus();
  const client = new YahooQuoteClient();
  const store = await MongoDbInstrumentStore.init();

  const quote = await client.lastPrice(symbol);

  if (!quote) {
    console.error("No quote found");
    return;
  }

  await store.updateQuote(symbol, quote);
  await bus.publish("quote_updated", { symbol, quote });

  console.info(`Successfully processed event`);
};
