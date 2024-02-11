import { Context, SNSEvent, SNSEventRecord } from "aws-lambda";
import * as fc from "fast-check";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodFastCheck } from "zod-fast-check";
import { SNSEventBus } from "../src/bus";
import { handler } from "../src/lambda";
import { YahooQuoteClient } from "../src/quoteClient";
import { MongoDbInstrumentStore, Quote } from "../src/store";

vi.mock("../src/bus/sns");
vi.mock("../src/quoteClient/yahoo");
vi.mock("../src/store/mongodb");

const mockPublish = SNSEventBus.prototype.publish as Mock;
const mockLastPrice = YahooQuoteClient.prototype.lastPrice as Mock;
const mockUpdateQuote = MongoDbInstrumentStore.prototype.updateQuote as Mock;
(MongoDbInstrumentStore.init as Mock).mockResolvedValue({
  updateQuote: mockUpdateQuote,
});

const QuoteArbitrary = ZodFastCheck().inputOf(Quote);

describe("handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle the event", async () => {
    const symbol = "NN.AS";
    const event: SNSEvent = {
      Records: [
        {
          Sns: { Message: JSON.stringify({ symbol }) },
        } as SNSEventRecord,
      ],
    };
    const quoteSample = fc.sample(QuoteArbitrary, 1)[0];

    mockLastPrice.mockResolvedValueOnce(quoteSample);

    await handler(event, {} as Context, vi.fn());

    expect(mockLastPrice).toHaveBeenCalledTimes(1);
    expect(mockLastPrice).toHaveBeenCalledWith(symbol);
    expect(mockUpdateQuote).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuote).toHaveBeenCalledWith(symbol, quoteSample);
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith("quote_updated", {
      symbol,
      quote: quoteSample,
    });
  });

  it("should fail if no quote found", async () => {
    const symbol = "NN.AS";
    const event: SNSEvent = {
      Records: [
        {
          Sns: { Message: JSON.stringify({ symbol }) },
        } as SNSEventRecord,
      ],
    };

    mockLastPrice.mockResolvedValueOnce(null);

    await handler(event, {} as Context, vi.fn());

    expect(mockLastPrice).toHaveBeenCalledTimes(1);
    expect(mockLastPrice).toHaveBeenCalledWith(symbol);
    expect(mockUpdateQuote).toHaveBeenCalledTimes(0);
    expect(mockPublish).toHaveBeenCalledTimes(0);
  });
});
