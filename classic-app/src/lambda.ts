import type { Handler, SNSEvent } from "aws-lambda";
import { z } from "zod";
import { SNSEventBus } from "./bus";
import { YahooQuoteClient } from "./quoteClient";
import { MongoDbInstrumentStore } from "./store";

const messageSchema = z.object({ instrumentId: z.string() });

const handler: Handler<SNSEvent, void> = async (event) => {
  console.info(`Received event: `, event);

  const message = JSON.parse(event.Records[0].Sns.Message);
  const { instrumentId } = messageSchema.parse(message);

  const bus = new SNSEventBus();
  const client = new YahooQuoteClient();
  const store = await MongoDbInstrumentStore.init();

  const instrument = await store.getById(instrumentId);
  const quote = await client.lastPrice(instrument.symbol);

  if (!quote) {
    throw new Error("No quote found");
  }

  await store.updateQuote(instrumentId, quote);
  await bus.publish("quote_updated", { instrumentId, quote });

  console.info(`Successfully processed event`);
};

module.exports.handler = handler;
