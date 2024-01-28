---
theme: css/nn.css
highlightTheme: css/github-dark-default.css
# transition: concave
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
- Dependency Management: inversify / tsyringe / typedi <!-- .element: class="fragment"  -->
- Utilities: ramda / lodash / underscore / fp-ts <!-- .element: class="fragment"  -->
- Reactive Programming: rxjs <!-- .element: class="fragment"  -->
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
// Promise<Quote | null>
const lastPrice = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return responseSchema.parse(json);
};
```

to

```ts [|5|6|7|1]
// Effect.Effect<never, Cause.UnknownException | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => {
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
// Promise<Quote | null>
const lastPrice = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return responseSchema.parse(json);
};
```

to

<!-- prettier-ignore -->
```ts [|4|5|6|1]
// Effect.Effect<never, Cause.UnknownException | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = yield* _(Effect.tryPromise(() => fetch(url)));
  const json = yield* _(Effect.tryPromise(() => res.json()));
  return yield* _(Schema.parse(ResponseSchema)(json));
}); 
```

<div>
<code>Effect.flatMap(effect)</code> <b style="color: blue">---></b> <code>yield* _(effect)</code>
</div>

--

Handling errors

<!-- prettier-ignore -->
```ts [|8-13|10|1-3,5,11|18-30|18|19-24|25-28|17,29]
class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(
    Effect.tryPromise({
      try: () => fetch(url).then((res) => res.json()),
      catch: () => new FetchError({ message: `Failed to fetch ${url}` }),
    })
  );
  return yield* _(Schema.parse(ResponseSchema)(json));
});

// Effect.Effect<never, never, Quote | null>
const program = lastPrice("NN.AS").pipe(
  Effect.catchTags({
    FetchError: (error: FetchError) => {
      console.error(error.message);
      return Effect.succeed(null);
    },
  }),
  Effect.catchAll((error: ParseResult.ParseError) => {
    console.error(error.message);
    return Effect.succeed(null);
  }),
  // Effect.orDie
);
```

--

Running `Effect`s

```ts [1-2|4-5|7-8|10-11|13-14|16-17]
// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const program = lastPrice("NN.AS");

// Promise<Quote>
const promise = Effect.runPromise(program);

// Promise<Exit<FetchError | ParseResult.ParseError, Quote>>
const promiseExit = Effect.runPromiseExit(program);

// Quote
const quote = Effect.runSync(program);

// Exit<FetchError | ParseResult.ParseError, Quote>
const quoteExit = Effect.runSyncExit(program);

// RuntimeFiber<FetchError | ParseResult.ParseError, Quote>
Effect.runFork(program);
```

--

The end-to-end program example

<!-- prettier-ignore -->
```ts [|1-3|5-10|12-17|19-24]
class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

// Effect.Effect<never, FetchError, unknown>
const effectfulFetch = (...args: Parameters<typeof fetch>) =>
  Effect.tryPromise({
    try: () => fetch(...args).then((res) => res.json()),
    catch: () => new FetchError({ message: `Failed to fetch ${args[0]}` }),
  });

// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.parse(ResponseSchema)(json));
});

export const handler = async (event) => {
  // Effect.Effect<never, never, Quote>
  const program = lastPrice("NN.AS").pipe(Effect.orDie);

  return await Effect.runPromise(program);
};
```

---

Dependency Management (Context & Layers)

```ts
// Overly simplified
type Effect<R, E, A> = (context: R) => E | A;
```

- `R` - Dependencies

<!-- prettier-ignore -->
```ts [|14]
import { Effect } from "effect";

const baseUrl = "https://query2.finance.yahoo.com/v8";

// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.parse(ResponseSchema)(json));
});
 
export const handler = async (event) => {
  // Effect.Effect<never, never, Quote>
  const program = lastPrice("NN.AS").pipe(Effect.orDie);
 
  return await program.pipe(Effect.runPromise);
};
```

<!-- .element: class="fragment" data-fragment-index="1" -->

--

Let's define a service

```ts
interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>;
}
```

```ts
import { Context } from "effect";

// Context.Tag<QuoteClient, QuoteClient>
const QuoteClient = Context.Tag<QuoteClient>();
```

<!-- .element: class="fragment" data-fragment-index="1" -->

<div>Think <code>Context.Tag</code> of being like registering a service interface in a global context</div> <!-- .element: class="fragment" data-fragment-index="2" -->

--

Using `Tag`s

<!-- prettier-ignore -->
```ts [|3-8|14|15|13|19-21]
import { Effect, Context } from "effect";

interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>;
}
const QuoteClient = Context.Tag<QuoteClient>();

// ...
 
export const handler = async (event) => {
  // Effect.Effect<QuoteClient, never, Quote>
  const program = QuoteClient.pipe(
    Effect.flatMap((client) => client.lastPrice("NN.AS")),
    Effect.orDie,
  )
 
  // Type 'QuoteClient' is not assignable to type 'never'.
  return await program.pipe(Effect.runPromise);
  //                        ~~~~~~~~~~~~~~~~~
};
```

--

Providing service for `Tag`s

<!-- prettier-ignore -->
```ts [25]
import { Effect, Context } from "effect";

interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>;
}
const QuoteClient = Context.Tag<QuoteClient>();

// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.parse(ResponseSchema)(json));
});

export const handler = async (event) => {
  // Effect.Effect<QuoteClient, never, Quote>
  const program = QuoteClient.pipe(
    Effect.flatMap((client) => client.lastPrice("NN.AS")),
    Effect.orDie,
  );

  return await program.pipe(
    Effect.provideService(QuoteClient, { lastPrice }),
    Effect.runPromise
  );
};
```

--

Providing layer

<!-- prettier-ignore -->
```ts [19,29||10,14]
import { Effect, Context } from "effect";

interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>;
}
const QuoteClient = Context.Tag<QuoteClient>();

const baseUrl = "https://query2.finance.yahoo.com/v8";

// Effect.Effect<never, FetchError | ParseResult.ParseError, Quote>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.parse(ResponseSchema)(json));
});

export const YahooQuoteClientImpl = Layer.succeed(QuoteClient, { lastPrice });

export const handler = async (event) => {
  // Effect.Effect<QuoteClient, never, Quote>
  const program = QuoteClient.pipe(
    Effect.flatMap((client) => client.lastPrice("NN.AS")),
    Effect.orDie,
  );

  return await program.pipe(
    Effect.provide(YahooQuoteClientImpl),
    Effect.runPromise
  );
};
```

--

Configuration Management

<!-- prettier-ignore -->
```ts [9,10|5|4|15-17|15-17,27]
import { Effect, Config } from "effect";

// Effect.Effect<
//   never,
//   FetchError | ParseResult.ParseError | ConfigError.ConfigError,
//   Quote
// >
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const baseUrl = yield* _(Config.string("YAHOO_BASE_URL"));
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.parse(ResponseSchema)(json));
});

const ConfigImpl = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["YAHOO_BASE_URL", "localhost"]]))
);

export const handler = async (event) => {
  // Effect.Effect<QuoteClient, never, Quote>
  const program = QuoteClient.pipe(
    Effect.flatMap((client) => client.lastPrice("NN.AS")),
    Effect.orDie
  );

  return await program.pipe(
    Effect.provide(Layer.merge(YahooQuoteClientImpl, ConfigImpl)),
    Effect.runPromise
  );
};
```

--

`Effect` Runtime System

```ts [|1-2|4-5|7-10|19]
// Layer.Layer<never, never, QuoteClient>
const LambdaLayer = Layer.merge(YahooQuoteClientImpl, ConfigImpl);

// Scope.CloseableScope
const scope = Effect.runSync(Scope.make());

// Runtime.Runtime<QuoteClient>
const lambdaRuntime = Effect.runSync(
  Layer.toRuntime(LambdaLayer).pipe(Scope.extend(scope))
);

export const handler = async () => {
  // Effect.Effect<QuoteClient, never, Quote>
  const program = QuoteClient.pipe(
    Effect.flatMap((client) => client.lastPrice("NN.AS")),
    Effect.orDie
  );

  return await program.pipe(Runtime.runPromise(lambdaRuntime));
};
```

<div>in fact the <strong><code>Effect.runPromise</code></strong> is just a shorthand for <strong><code>Runtime.runPromise(defaultRuntime)</code></strong>.</div> <!-- .element: class="fragment" -->

---

##### Conclusion

1. Errors
   - we still need to handle errors in multiple places, but `Effect` and `TypeScript` help us by showing all the expected error types
   - `Effect` helps us to unify errors and provides mechanisms of handling in type safe manner
   - errors are typed
2. Dependencies
   - loosely coupled to the implementation by using `Tag`s and `Layer`s
   - easy to substitute by providing `Layer`s with mocked implementation for tests
   - easy to replace by providing different `Layer` implementing the same `Tag`

---

Final Effect app

```ts [345-368|301-304|346|347|343,352-355|357-359|361|362|364|365|368|371-375,377|332-341]
import {
  PublishCommandInput,
  PublishCommandOutput,
  SNS,
} from "@aws-sdk/client-sns";
import { ParseResult, Schema } from "@effect/schema";
import type { Context as LambdaContext, SNSEvent } from "aws-lambda";
import {
  Cause,
  Config,
  Console,
  Context,
  Data,
  Effect,
  Exit,
  Layer,
  Runtime,
  Scope,
  pipe,
} from "effect";
import { Db, MongoClient, MongoClientOptions, ObjectId } from "mongodb";

const ObjectIdFromString = Schema.transformOrFail(
  Schema.union(Schema.string, Schema.number),
  Schema.instanceOf(ObjectId),
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

const Quote = Schema.struct({
  timestamp: Schema.number,
  close: Schema.number,
  high: Schema.number,
  low: Schema.number,
  open: Schema.number,
  volume: Schema.number,
});
type Quote = Schema.Schema.To<typeof Quote>;

const InstrumentDocument = Schema.struct({
  id: Schema.string,
  symbol: Schema.string,
  name: Schema.string,
  isin: Schema.string,
  quote: Quote,
  deleted_at: Schema.optional(Schema.nullable(Schema.string)),
});
type InstrumentDocument = Schema.Schema.To<typeof InstrumentDocument>;

interface InstrumentStore {
  getById: (
    id: string
  ) => Effect.Effect<
    never,
    | Cause.UnknownException
    | Cause.NoSuchElementException
    | ParseResult.ParseError,
    InstrumentDocument
  >;
  updateQuote: (
    id: string,
    quote: Quote
  ) => Effect.Effect<
    never,
    Cause.UnknownException | ParseResult.ParseError,
    void
  >;
}

const InstrumentStore = Context.Tag<InstrumentStore>();

const DatabaseTag = Context.Tag<Db>();

const mongoDbConnect = (mongodbUrl: string, options?: MongoClientOptions) =>
  Effect.logInfo("Connecting to MongoDB").pipe(
    Effect.flatMap(() =>
      Effect.tryPromise(() => MongoClient.connect(mongodbUrl, options))
    ),
    Effect.tap(() => Effect.logInfo("Connected to MongoDB"))
  );

const mongoDbClose = (force?: boolean) => (client: MongoClient) =>
  Effect.logInfo("Closing MongoDB connection").pipe(
    Effect.flatMap(() => Effect.promise(() => client.close(force))),
    Effect.tap(() => Effect.logInfo("MongoDB connection closed"))
  );

const mongoDbImpl = (mongodbUrl: string, options?: MongoClientOptions) =>
  pipe(
    Effect.acquireRelease(mongoDbConnect(mongodbUrl, options), mongoDbClose()),
    Effect.flatMap((client) => Effect.try(() => client.db()))
  );

const MongoDbLayer = Layer.scoped(
  DatabaseTag,
  Config.string("MONGODB_URL").pipe(Effect.flatMap(mongoDbImpl))
);

const InstrumentStoreLayer = Layer.effect(
  InstrumentStore,
  Effect.gen(function* (_) {
    const db = yield* _(DatabaseTag);

    const getById: InstrumentStore["getById"] = (id) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.flatMap((_id) =>
          Effect.tryPromise(() =>
            db
              .collection<InstrumentDocument>("instruments")
              .findOne({ _id, deleted_at: null })
          )
        ),
        Effect.flatMap(Effect.fromNullable),
        Effect.flatMap(Schema.decode(InstrumentDocument))
      );

    const updateQuote: InstrumentStore["updateQuote"] = (id, quote) =>
      Schema.decode(ObjectIdFromString)(id).pipe(
        Effect.flatMap((_id) =>
          Effect.tryPromise(() =>
            db
              .collection("instruments")
              .findOneAndUpdate({ _id }, { $set: { quote } })
          )
        ),
        Effect.asUnit
      );

    return InstrumentStore.of({
      getById,
      updateQuote,
    });
  })
);

const MongoDbInstrumentStoreImpl = Layer.provide(
  InstrumentStoreLayer,
  MongoDbLayer
);

interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<never, FetchError | Cause.NoSuchElementException, Quote>;
}

const QuoteClient = Context.Tag<QuoteClient>();

class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

const effectfulFetch = (...args: Parameters<typeof fetch>) =>
  Effect.tryPromise({
    try: () => fetch(...args).then((res) => res.json()),
    catch: () => new FetchError({ message: `Failed to fetch ${args[0]}` }),
  });

const YahooQuote = Schema.struct({
  close: Schema.array(Schema.number),
  high: Schema.array(Schema.number),
  low: Schema.array(Schema.number),
  open: Schema.array(Schema.number),
  volume: Schema.array(Schema.number),
});

const YahooChartResult = Schema.struct({
  indicators: Schema.struct({ quote: Schema.array(YahooQuote) }),
  timestamp: Schema.array(Schema.number),
});

const YahooResponse = Schema.transform(
  Schema.struct({
    chart: Schema.struct({ result: Schema.array(YahooChartResult) }),
  }),
  Quote,
  (r) => ({
    timestamp: r.chart.result[0].timestamp[0],
    close: r.chart.result[0].indicators.quote[0].close[0],
    high: r.chart.result[0].indicators.quote[0].high[0],
    low: r.chart.result[0].indicators.quote[0].low[0],
    open: r.chart.result[0].indicators.quote[0].open[0],
    volume: r.chart.result[0].indicators.quote[0].volume[0],
  }),
  (r) => ({
    chart: {
      result: [
        {
          indicators: {
            quote: [
              {
                close: [r.close],
                high: [r.high],
                low: [r.low],
                open: [r.open],
                volume: [r.volume],
              },
            ],
          },
          timestamp: [r.timestamp],
        },
      ],
    },
  })
);

const baseUrl = "https://query2.finance.yahoo.com/v8";

const lastPrice = (symbol: string) =>
  Effect.gen(function* (_) {
    const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
    const json = yield* _(effectfulFetch(url));
    return yield* _(Schema.parseOption(YahooResponse)(json));
  });

const YahooQuoteClientImpl = Layer.succeed(
  QuoteClient,
  QuoteClient.of({ lastPrice })
);

interface EventBus {
  send: <T>(
    from: string,
    to: string,
    payload: T
  ) => Effect.Effect<never, Cause.UnknownException, void>;

  publish: <T>(
    from: string,
    payload: T
  ) => Effect.Effect<never, Cause.UnknownException, void>;
}

const EventBus = Context.Tag<EventBus>();

interface SNSService {
  publish: (
    params: PublishCommandInput
  ) => Effect.Effect<never, Cause.UnknownException, PublishCommandOutput>;
}

const SNSService = Context.Tag<SNSService>();

const SNSServiceLayer = Layer.effect(
  SNSService,
  Effect.gen(function* (_) {
    const sns = yield* _(Effect.try(() => new SNS()));

    return SNSService.of({
      publish: (params) => Effect.tryPromise(() => sns.publish(params)),
    });
  })
);

const EventBusLayer = Layer.effect(
  EventBus,
  Effect.gen(function* (_) {
    const domainTopicArn = yield* _(Config.string("DOMAIN_TOPIC_ARN"));
    const sns = yield* _(SNSService);

    const sendMessage = <T>(
      exchangeType: string,
      from: string,
      to: string,
      payload: T
    ) =>
      sns
        .publish({
          TopicArn: domainTopicArn,
          Message: JSON.stringify(payload),
          MessageAttributes: {
            source: { DataType: "String", StringValue: from },
            destination: { DataType: "String", StringValue: to },
            exchange_type: { DataType: "String", StringValue: exchangeType },
          },
        })
        .pipe(Effect.asUnit);

    return EventBus.of({
      send: (from, to, payload) => sendMessage("direct", from, to, payload),
      publish: (from, payload) =>
        sendMessage("fanout", from, "subscriber", payload),
    });
  })
);

const SNSEventBusImpl = Layer.provide(EventBusLayer, SNSServiceLayer);

type EffectHandler<T, R, E = never, A = void> = (
  event: T,
  context: LambdaContext
) => Effect.Effect<R, E, A>;

const fromLayer = <R, E>(layer: Layer.Layer<never, E, R>) => {
  const scope = Effect.runSync(Scope.make());
  const runtime = Layer.toRuntime(layer).pipe(
    Scope.extend(scope),
    Effect.runPromise
  );
  const destroy = Scope.close(scope, Exit.unit);

  const signalHandler: NodeJS.SignalsListener = (signal) => {
    Effect.runFork(
      Effect.gen(function* (_) {
        yield* _(Console.log(`[runtime] ${signal} received`));
        yield* _(Console.log("[runtime] cleaning up"));
        yield* _(destroy);
        yield* _(Console.log("[runtime] exiting"));
        yield* _(Effect.sync(() => process.exit(0)));
      })
    );
  };

  process.on("SIGTERM", signalHandler);
  process.on("SIGINT", signalHandler);

  return runtime;
};

function makeLambda<T, R, E1, E2, A>(
  handler: EffectHandler<T, R, E1, A>,
  globalLayer: Layer.Layer<never, E2, R>
) {
  const runtimePromise = fromLayer(globalLayer);
  return async (event: T, context: LambdaContext) => {
    const runPromise = Runtime.runPromise(await runtimePromise);
    return handler(event, context).pipe(runPromise);
  };
}

const Message = Schema.struct({ instrumentId: Schema.string });

const effectHandler: EffectHandler<
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore
> = (event) =>
  Effect.gen(function* (_) {
    yield* _(Console.log(`Received event: `, event));

    const decodeMessage = Schema.decode(Schema.parseJson(Message));
    const { instrumentId } = yield* _(
      decodeMessage(event.Records[0].Sns.Message)
    );

    const bus = yield* _(EventBus);
    const client = yield* _(QuoteClient);
    const store = yield* _(InstrumentStore);

    const instrument = yield* _(store.getById(instrumentId));
    const quote = yield* _(client.lastPrice(instrument.symbol));

    yield* _(store.updateQuote(instrumentId, quote));
    yield* _(bus.publish("quote_updated", { instrumentId, quote }));

    yield* _(Console.log(`Successfully processed event`));
  }).pipe(Effect.orDie);

// Layer.Layer<never, Cause.UnknownException | ConfigError, InstrumentStore | QuoteClient | EventBus>
const LambdaLive = Layer.mergeAll(
  SNSEventBusImpl,
  YahooQuoteClientImpl,
  MongoDbInstrumentStoreImpl
);

module.exports.handler = makeLambda(effectHandler, LambdaLive);
```

---

## Q&A

---

Links

- [Effect](https://www.effect.website/)
- [Effect Docs](https://effect-ts.github.io/effect/)
- [Effect Github](https://github.com/Effect-TS/effect)
- [Effectful AWS Github](https://github.com/floydspace/effect-aws)
