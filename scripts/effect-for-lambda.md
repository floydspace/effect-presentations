---
theme: css/nn.css
highlightTheme: css/github-dark-default.css
transition: concave
---

<img src="attachments/effect-logo2.png" alt="My Image" style="filter: invert(1); border: none" />
# Effect for Lambda

Or Functional Programming for Functions

---

Overview

```ts [167-189|165,170-171|173-175|177|178|180-183|185|186|126-129|131-138|140-150|152-162|79-81|115-124|83-113|6-24|26-29|31-50|34-36|38-46|40|60-70|72-76]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient, ObjectId } from "mongodb";
import { z } from "zod";

const Quote = z.object({
  timestamp: z.number(),
  close: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  volume: z.number(),
});
type Quote = z.infer<typeof Quote>;

const InstrumentDocument = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  isin: z.string(),
  quote: QuoteDocument,
  deleted_at: z.string().nullable().optional(),
});
type InstrumentDocument = z.infer<typeof InstrumentDocument>;

interface InstrumentStore {
  getById: (id: string) => Promise<InstrumentDocument>;
  updateQuote: (id: string, quote: Quote) => Promise<void>;
}

class MongoDbInstrumentStore implements InstrumentStore {
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

interface QuoteClient {
  lastPrice: (symbol: string) => Promise<Quote | null>;
}

const chartResultSchema = z
  .object({
    indicators: z.object({
      quote: z.array(
        z.object({
          close: z.array(z.number()),
          high: z.array(z.number()),
          low: z.array(z.number()),
          open: z.array(z.number()),
          volume: z.array(z.number()),
        })
      ),
    }),
    timestamp: z.array(z.number()),
  })
  .transform((value) =>
    value.timestamp.length
      ? {
          timestamp: value.timestamp[0],
          close: value.indicators.quote[0].close[0],
          high: value.indicators.quote[0].high[0],
          low: value.indicators.quote[0].low[0],
          open: value.indicators.quote[0].open[0],
          volume: value.indicators.quote[0].volume[0],
        }
      : null
  );

const responseSchema = z
  .object({ chart: z.object({ result: z.array(chartResultSchema) }) })
  .transform((value) => value.chart.result[0]);

class YahooQuoteClient implements QuoteClient {
  private readonly baseUrl = "https://query2.finance.yahoo.com/v8";

  async lastPrice(symbol: string): Promise<Quote | null> {
    const url = `${this.baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return responseSchema.parse(json);
  }
}

interface EventBus {
  send: <T>(from: string, to: string, payload: T) => Promise<void>;
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
  }

  async send<T>(from: string, to: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: to },
        exchange_type: { DataType: "String", StringValue: "direct" },
      },
    });
  }

  async publish<T>(from: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: "subscriber" },
        exchange_type: { DataType: "String", StringValue: "fanout" },
      },
    });
  }
}

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
    console.error("No quote found");
    return;
  }

  await store.updateQuote(instrumentId, quote);
  await bus.publish("quote_updated", { instrumentId, quote });

  console.info(`Successfully processed event`);
};

module.exports.handler = handler;
```

---

What problems do you see here?

```ts
async function lastPrice(symbol: string): Promise<Quote | null> {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return responseSchema.parse(json);
}
```

1. Errors <!-- .element: class="fragment" data-fragment-index="1" -->
   - we need to handle errors in multiple places <!-- .element: class="fragment" data-fragment-index="1" -->
   - different ways of handling errors in different places <!-- .element: class="fragment" data-fragment-index="2" -->
   - errors are not typed <!-- .element: class="fragment" data-fragment-index="3" -->

--

Different ways of handling errors problem example

```ts
export const httpErrorHandlerMiddleware = (): MiddlewareObj<any, any> => {
  return {
    onError: async ({ error }): Promise<APIGatewayProxyResult> => {
      const { processId, requestId, logger } = getContext();
      const { message, name, stack } = error as any; // TODO: should have some Error type, to be discussed

      logger.error(name, {
        message,
        stackTrace: stack,
      });

      let statusCode: number = 500;
      switch (true) {
        case error instanceof ClientError:
          statusCode = 400;
          break;
        case error instanceof ZodError:
          statusCode = 400;
          break;
        case error instanceof HttpError:
          statusCode = (error as HttpError).statusCode;
          break;
        default:
          statusCode = 500;
      }

      if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
      }

      let responseBody: ErrorResponseBody;
      switch (true) {
        case error instanceof ZodError:
          responseBody = handleZodError(
            error as ZodError,
            processId,
            requestId
          );
          break;
        default:
          responseBody = handleDefaultError(error, requestId, processId);
      }

      return {
        body: JSON.stringify(responseBody),
        statusCode,
      };
    },
  };
};
```

--

```ts [122-123,125-127,129,130,137,138|16-18,22|39,43-45,51|9-10|62|79-80]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient, ObjectId } from "mongodb";
import { z } from "zod";

// ...

interface InstrumentStore {
  getById: (id: string) => Promise<InstrumentDocument>;
  updateQuote: (id: string, quote: Quote) => Promise<void>;
}

class MongoDbInstrumentStore implements InstrumentStore {
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

interface QuoteClient {
  lastPrice: (symbol: string) => Promise<Quote | null>;
}

// ...

class YahooQuoteClient implements QuoteClient {
  private readonly baseUrl = "https://query2.finance.yahoo.com/v8";

  async lastPrice(symbol: string): Promise<Quote | null> {
    const url = `${this.baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return responseSchema.parse(json);
  }
}

interface EventBus {
  send: <T>(from: string, to: string, payload: T) => Promise<void>;
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
  }

  async send<T>(from: string, to: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: to },
        exchange_type: { DataType: "String", StringValue: "direct" },
      },
    });
  }

  async publish<T>(from: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: "subscriber" },
        exchange_type: { DataType: "String", StringValue: "fanout" },
      },
    });
  }
}

// ...

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
    console.error("No quote found");
    return;
  }

  await store.updateQuote(instrumentId, quote);
  await bus.publish("quote_updated", { instrumentId, quote });

  console.info(`Successfully processed event`);
};

module.exports.handler = handler;
```

---

What other problems are here?

```ts [119-141|125-127|88-89|17,27-28]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient, ObjectId } from "mongodb";
import { z } from "zod";

// ...

interface InstrumentStore {
  getById: (id: string) => Promise<InstrumentDocument>;
  updateQuote: (id: string, quote: Quote) => Promise<void>;
}

class MongoDbInstrumentStore implements InstrumentStore {
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

interface QuoteClient {
  lastPrice: (symbol: string) => Promise<Quote | null>;
}

// ...

class YahooQuoteClient implements QuoteClient {
  private readonly baseUrl = "https://query2.finance.yahoo.com/v8";

  async lastPrice(symbol: string): Promise<Quote | null> {
    const url = `${this.baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return responseSchema.parse(json);
  }
}

interface EventBus {
  send: <T>(from: string, to: string, payload: T) => Promise<void>;
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
  }

  async send<T>(from: string, to: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: to },
        exchange_type: { DataType: "String", StringValue: "direct" },
      },
    });
  }

  async publish<T>(from: string, payload: T) {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        source: { DataType: "String", StringValue: from },
        destination: { DataType: "String", StringValue: "subscriber" },
        exchange_type: { DataType: "String", StringValue: "fanout" },
      },
    });
  }
}

// ...

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
    console.error("No quote found");
    return;
  }

  await store.updateQuote(instrumentId, quote);
  await bus.publish("quote_updated", { instrumentId, quote });

  console.info(`Successfully processed event`);
};

module.exports.handler = handler;
```

1. Dependencies <!-- .element: class="fragment" data-fragment-index="0" -->
   - tightly coupled to the implementation <!-- .element: class="fragment" data-fragment-index="0" -->
   - hard to substitute for tests <!-- .element: class="fragment" data-fragment-index="0" -->
   - hard to replace <!-- .element: class="fragment" data-fragment-index="0" -->

--

<grid drag="40 55" drop="0 10">
### Yes

- [InversifyJS](https://github.com/inversify/InversifyJS)
- [TSyringe](https://github.com/Microsoft/tsyringe)
- [TypeDI](https://github.com/typestack/typedi)
</grid>
<grid drag="60 55" drop="50 22">
<style>
	.fragment.fade-out.visible {
    display: none;
	}
</style>

![[https://64.media.tumblr.com/f5436f265630043b4163b3b796436229/tumblr_nerv5zwzCr1sgl0ajo1_500.gifv|50]] <!-- .element: class="fragment fade-out" data-fragment-index="0" -->
</grid>
<grid drag="60 55" drop="50 22">

### But <!-- .element: class="fragment" data-fragment-index="1" -->

- IaC solutions usually are not type safe enough <!-- .element: class="fragment" data-fragment-index="1" -->
- They enforce writing OOP code <!-- .element: class="fragment" data-fragment-index="1" -->
- They are not portable and also a dependency <!-- .element: class="fragment" data-fragment-index="1" -->
- They based on "reflect-metadata" and/or decorators <!-- .element: class="fragment" data-fragment-index="1" -->
  </grid>

---

How **Effect** can help to solve these problems?

--
<grid drag="100 45" drop="0 0">
**Effect** is a typescript library that gives you ecosystem of tools to make it easy to write complex applications in a safe and composable manner.
</grid>
<grid drag="30 80" drop="0 30">
Wait, what? Another one dependency? <!-- .element: class="fragment" data-fragment-index="0" -->
![Image](https://media.tenor.com/97OpsiPBxzkAAAAM/surprising-dog.gif) <!-- .element: class="fragment" data-fragment-index="0" -->
</grid>
<grid drag="100 80" drop="30 27">

<p><strong>YES, BUT</strong> Effect tools can replace a lot of libraries like:</p> <!-- .element: class="fragment"  -->

- Configuration: convict <!-- .element: class="fragment"  -->
- Schema Validation & Transformation: ajv / joi / zod / io-ts / morphism <!-- .element: class="fragment"  -->
- Logging + Tracing: pino / winston / opentelemetry <!-- .element: class="fragment"  -->
- Caching + Batching: dataloader <!-- .element: class="fragment"  -->
- Pattern Matching: ts-pattern <!-- .element: class="fragment"  -->
- Dependency Injection: inversify / tsyringe / typedi <!-- .element: class="fragment"  -->
- Utilities: ramda / lodash / underscore <!-- .element: class="fragment"  -->
- Probably others I don't know about <!-- .element: class="fragment"  -->
  </grid>

--

<p>The <strong><code>Effect</code></strong> type:</p>

```ts
// Overly simplified
type Effect<R, E, A> = (context: R) => E | A;
```

- `R` - Dependencies
- `E` - Errors
- `A` - Value

```ts
// Still overly simplified
type Effect<R, E, A> = ReaderTaskEither<R, E, A> | ReaderIOEither<R, E, A>;

type ReaderTaskEither<R, E, A> = (context: R) => TaskEither<E, A>;
type ReaderIOEither<R, E, A> = (context: R) => IOEither<E, A>;

type TaskEither<E, A> = Task<Either<E, A>>;
type IOEither<E, A> = IO<Either<E, A>>;

type Task<A> = () => Promise<A>;
type IO<A> = () => A;

type Either<E, A> = Left<E> | Right<A>;

type Left<E> = { readonly _tag: "Left"; readonly left: E };
type Right<A> = { readonly _tag: "Right"; readonly right: A };
```

<!-- .element: class="fragment" data-fragment-index="2" -->

<style>
  img {
    border: none !important
  }
</style>
<grid drag="60 55" drop="0 45">
![Image](https://ih0.redbubble.net/image.1914803365.6845/raf,360x360,075,t,fafafa:ca443f4786.jpg)
</grid><!-- .element: class="fragment" data-fragment-index="3" -->

---

The **`unit`** `Effect`

```ts
import { Effect } from "effect";

const unit: Effect.Effect<never, never, void> = Effect.unit;
```

- `R` - `never` - no dependencies
- `E` - `never` - never fails
- `A` - `void` - returns nothing

```ts
// can think of being like `noop`
const unit = () => {};
```

--

The **`never`** `Effect`

```ts
import { Effect } from "effect";

const never: Effect.Effect<never, never, never> = Effect.never;
```

- `R` - `never` - no dependencies
- `E` - `never` - never fails
- `A` - `never` - never returns

```ts
// can think of being like infinite loop
const never = () => {
  while (true) {}
};
```

--

Simple `Effect`s

```ts
import { Effect } from "effect";

const success: Effect.Effect<never, never, number> = Effect.succeed(42);
```

- `R` - `never` - no dependencies
- `E` - `never` - never fails
- `A` - `number` - returns 42

```ts
import { Effect } from "effect";

const failure: Effect.Effect<never, Error, never> = Effect.fail(new Error());
```

- `R` - `never` - no dependencies
- `E` - `Error` - fails with `Error`
- `A` - `void` - never returns

--

`Effect` adapters

```ts [1-5|7-11|13-14|16-20]
// Effect<never, never, number>
const program = Effect.sync(() => {
  console.log("Hello, World!"); // side effect
  return 42; // return value
});

// Effect<never, Error, any>
const program = Effect.try({
  try: () => JSON.parse(""),
  catch: (nativeError) => new Error("JSON.parse threw an error"),
});

// Effect<never, never, number>
const program = Effect.promise(() => Promise.resolve(42));

// Effect<never, Error, Response>
const program = Effect.tryPromise({
  try: () => fetch("..."),
  catch: (nativeError) => new Error("fetch rejected"),
});
```

--

Combining `Effect`s

```ts [1]
const program = pipe(effect, func1, func2, ...)
// or
const program = effect.pipe(func1, func2, ...)
```

```ts [1|3-4|6-9|11-12|14-15]
const effect: Effect.Effect<never, never, number> = Effect.succeed(42);

// Effect.Effect<never, never, string>
const mappedEffect = effect.pipe(Effect.map((n: number) => n.toString()));

// Effect.Effect<never, never, string>
const flatEffect = effect.pipe(
  Effect.flatMap((n: number) => Effect.succeed(n.toString()))
);

// Effect.Effect<never, never, number>
const tappedEffect = effect.pipe(Effect.tap((n: number) => console.log(n)));

// Effect.Effect<never, never, [number, number]>
const combinedEffect = Effect.all([effect, effect]);
```

--

We can turn our `lastPrice` function from

```ts
const lastPrice: Promise<Quote | null> = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return responseSchema.parse(json);
};
```

to

<!-- prettier-ignore -->
```ts
const lastPrice: Effect.Effect<
  never,
  Cause.UnknownException | Cause.NoSuchElementException | ParseResult.ParseError,
  Quote
> = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  return pipe(
    Effect.tryPromise(() => fetch(url)),
    Effect.flatMap((res) => Effect.tryPromise(() => res.json())),
    Effect.flatMap((json) => Schema.parse(ResponseSchema)(json))
  );
};
```

--

Another approach using generators

```ts
const lastPrice: Promise<Quote | null> = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return responseSchema.parse(json);
};
```

to

<!-- prettier-ignore -->
```ts
const lastPrice: Effect.Effect<
  never,
  Cause.UnknownException | Cause.NoSuchElementException | ParseResult.ParseError,
  Quote
> = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = yield* _(Effect.tryPromise(() => fetch(url)));
  const json = yield* _(Effect.tryPromise(() => res.json()));
  return yield* _(Schema.parse(ResponseSchema)(json));
});
```
