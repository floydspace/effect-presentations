---
theme: css/nn.css
highlightTheme: css/github-dark-default.css
# transition: concave
---

<img src="attachments/effect-logo2.png" alt="My Image" style="filter: invert(1); border: none" />
# Effect for Lambda

Or Functional Programming for Functions

---

**What experience do you have with functional programming?**

1. _I prefer OOP (imperative code)_
2. _I like to write functional code (ramda, lodash/fp, etc.)_
3. _I have experience with the real (algebraic) FP (Haskell, Scala, F#, etc.)_

---

<!-- <grid drag="70 0" drop="20 10">
</grid> -->
<grid drag="30 70" drop="0 10">
Who am I?
<div style="text-align: right"><B>Victor Korzunin</B></div>
<img src="https://avatars.githubusercontent.com/u/5180700" alt="My Image" style="border: none; width: 200px" />
</grid>
<grid drag="100 45" drop="25 30">

- Software Engineer, 8+ years of experience

  - 7+ years with TypeScript
  - 5+ years with Serverless and AWS

- Open-Source Contributor

  <img src="https://camo.githubusercontent.com/8e66857b4f7f7c1c485f7098eb4b6cbcc6aa94e2c9af83979cbe273891587d61/68747470733a2f2f6769746875622d726561646d652d73746174732e76657263656c2e6170702f6170693f757365726e616d653d666c6f796473706163652673686f775f69636f6e733d7472756526686964655f626f726465723d7472756526686964655f7469746c653d74727565" alt="My Image" style="border: none; width: 400px;margin:0" />

- Ex- professional trader

    </grid>
    <grid drag="30 140" drop="0 10">

https://github.com/floydspace
https://twitter.com/F1oydRose
</grid>

---

Overview

```ts [129-150|132-133|135-137|139|141-144|146|147|103-105|107-114|116-126|56-58|92-101|60-90|6-14|16-18|20-39|23-25|27-35|29|49-53]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient } from "mongodb";
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

interface InstrumentStore {
  updateQuote: (symbol: string, quote: Quote) => Promise<void>;
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

  async updateQuote(symbol: string, quote: Quote) {
    await this.db
      .collection("instruments")
      .findOneAndUpdate({ symbol }, { $set: { quote } });
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

const quoteSchema = z
  .object({ chart: z.object({ result: z.array(chartResultSchema) }) })
  .transform((value) => value.chart.result[0]);

class YahooQuoteClient implements QuoteClient {
  private readonly baseUrl = "https://query2.finance.yahoo.com/v8";

  async lastPrice(symbol: string): Promise<Quote | null> {
    const url = `${this.baseUrl}/finance/chart/${symbol}?interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    return quoteSchema.parse(json);
  }
}

interface EventBus {
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
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

const handler: Handler<SNSEvent, void> = async (event) => {
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

module.exports.handler = handler;
```

---

What problems do you see here?

```ts
async function lastPrice(symbol: string): Promise<Quote | null> {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return quoteSchema.parse(json);
}
```

1. Errors <!-- .element: class="fragment" data-fragment-index="1" -->

   - we need to handle errors in multiple places <!-- .element: class="fragment" data-fragment-index="1" -->
   - different ways of handling errors in different places <!-- .element: class="fragment" data-fragment-index="2" -->
   - errors are not typed <!-- .element: class="fragment" data-fragment-index="3" -->

   ```ts [3]
   try {
     // ...
   } catch (error: unknown) {
     handleError(error);
   }
   ```

   <!-- .element: class="fragment" data-fragment-index="3" -->

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

```ts [94-95,97-99,101,108-109|15-17,21|38,42-44|9|49|66]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient } from "mongodb";
import { z } from "zod";

// ...

interface InstrumentStore {
  updateQuote: (symbol: string, quote: Quote) => Promise<void>;
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

  async updateQuote(symbol: string, quote: Quote) {
    await this.db
      .collection("instruments")
      .findOneAndUpdate({ symbol }, { $set: { quote } });
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
    return quoteSchema.parse(json);
  }
}

interface EventBus {
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
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

const handler: Handler<SNSEvent, void> = async (event) => {
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

module.exports.handler = handler;
```

---

What other problems are here?

```ts [91-112|97-99|74-75|16,26-27]
import { SNS } from "@aws-sdk/client-sns";
import type { Handler, SNSEvent } from "aws-lambda";
import { Db, MongoClient } from "mongodb";
import { z } from "zod";

// ...

interface InstrumentStore {
  updateQuote: (symbol: string, quote: Quote) => Promise<void>;
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

  async updateQuote(symbol: string, quote: Quote) {
    await this.db
      .collection("instruments")
      .findOneAndUpdate({ symbol }, { $set: { quote } });
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
    return quoteSchema.parse(json);
  }
}

interface EventBus {
  publish: <T>(from: string, payload: T) => Promise<void>;
}

class SNSEventBus implements EventBus {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor() {
    this.sns = new SNS({});
    this.topicArn = process.env.DOMAIN_TOPIC_ARN!;
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

const handler: Handler<SNSEvent, void> = async (event) => {
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

- DI solutions usually are not type safe enough or lack type inference <!-- .element: class="fragment" data-fragment-index="1" -->
- They enforce writing OOP code <!-- .element: class="fragment" data-fragment-index="1" -->
- They are not portable and also a dependency <!-- .element: class="fragment" data-fragment-index="1" -->
- They based on "reflect-metadata" and/or decorators <!-- .element: class="fragment" data-fragment-index="1" -->
- They are not tree shakeable <!-- .element: class="fragment" data-fragment-index="1" -->
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

- Configuration: node-config, convict <!-- .element: class="fragment"  -->
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

**Effect** is a direct successor of **fp-ts** and is inspired by **ZIO** Scala library.

--

<p>The <strong><code>Effect</code></strong> type:</p>

```ts
// Overly simplified
type Effect<A, E, R> = (context: R) => E | A; // Effect<R, E, A> before v2.3
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

// Effect<void, never, never>
const unit: Effect.Effect<void> = Effect.unit;
```

- `A` - `void` - returns nothing
- `E` - `never` - never fails
- `R` - `never` - no dependencies

```ts
// can think of being like `noop`
const unit = () => {};
```

--

The **`never`** `Effect`

```ts
import { Effect } from "effect";

// Effect<never, never, never>
const never: Effect.Effect<never> = Effect.never;
```

- `A` - `never` - never returns
- `E` - `never` - never fails
- `R` - `never` - no dependencies

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

// Effect<number, never, never>
const success: Effect.Effect<number> = Effect.succeed(42);
```

- `A` - `number` - returns 42
- `E` - `never` - never fails
- `R` - `never` - no dependencies

```ts
import { Effect } from "effect";

// Effect<never, Error, never>
const failure: Effect.Effect<never, Error> = Effect.fail(new Error());
```

- `A` - `never` - never returns
- `E` - `Error` - fails with `Error`
- `R` - `never` - no dependencies

--

`Effect` constructors

```ts [1-4|6-10|12-13|15-19]
// Effect<number, never, never>
const program = Effect.sync(() => {
  return 42; // return value
});

// Effect<any, Error, never>
const program = Effect.try({
  try: () => JSON.parse(""),
  catch: (nativeError) => new Error("JSON.parse threw an error"),
});

// Effect<number, never, never>
const program = Effect.promise(() => Promise.resolve(42));

// Effect<Response, Error, never>
const program = Effect.tryPromise({
  try: () => fetch("..."),
  catch: (nativeError) => new Error("fetch rejected"),
});
```

--

Mapping & Combining `Effect`s

```ts [1|3-4|6-9|11-15|17-18|20-22,24-25]
const effect: Effect.Effect<number> = Effect.succeed(42);

// Effect<string, never, never>
const mappedEffect = Effect.map(effect, (n: number) => n.toString());

// Effect<string, never, never>
const flatEffect = Effect.flatMap(effect, (n: number) =>
  Effect.succeed(n.toString())
);

// Effect<string, UnknownException, never>
const thenEffect = Effect.andThen(effect, (n: number) =>
  Promise.resolve(n.toString())
);
// like Promise.then

// Effect<number, never, never>
const tappedEffect = Effect.tap(effect, (n: number) => console.log(n));

// Effect<[number, number], never, never>
const combinedEffect = Effect.all([effect, effect]);
// like Promise.all

// Effect<{e1: number, e2: number}, never, never>
const combinedEffect = Effect.all({ e1: effect, e2: effect });
```

--

Piping `Effect`s

```ts [1|3|5]
const program = func2(func1(effect));
// or
const program = pipe(effect, func1, func2, ...)
// or
const program = effect.pipe(func1, func2, ...)
```

```ts [1|3-4|6-9|11-14|16-17]
const effect: Effect.Effect<number> = Effect.succeed(42);

// Effect<string, never, never>
const mappedEffect = effect.pipe(Effect.map((n: number) => n.toString()));

// Effect<string, never, never>
const flatEffect = effect.pipe(
  Effect.flatMap((n: number) => Effect.succeed(n.toString()))
);

// Effect<string, never, never>
const thenEffect = effect.pipe(
  Effect.andThen((n: number) => Effect.succeed(n.toString()))
);

// Effect<number, never, never>
const tappedEffect = effect.pipe(Effect.tap((n: number) => console.log(n)));
```

--

We can turn our `lastPrice` function from

```ts
// Promise<Quote | null>
const lastPrice = async (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return quoteSchema.parse(json);
};
```

to

```ts [|5|6|7|1]
// Effect<Quote, Cause.UnknownException | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  return pipe(
    Effect.tryPromise(() => fetch(url)),
    Effect.andThen((res) => res.json()),
    Effect.andThen(Schema.decodeUnknown(QuoteSchema))
  );
};
```

--

Another approach using generators

```ts
// Promise<Quote | null>
const lastPrice = async (symbol: string) => {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = await fetch(url);
  const json = await res.json();
  return quoteSchema.parse(json);
};
```

to

<!-- prettier-ignore -->
```ts [|4|5|6|1]
// Effect<Quote, Cause.UnknownException | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const res = yield* _(Effect.tryPromise(() => fetch(url)));
  const json = yield* _(Effect.tryPromise(() => res.json()));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
}); 
```

<div>
<code>Effect.flatMap(effect)</code> <b style="color: blue">---></b> <code>yield* _(effect)</code>
</div>

--

Handling errors

<!-- prettier-ignore -->
```ts [|9-14|11|1-4,6,12|19-31|19|20-25|26-29|18,30]
class FetchError {
  _tag = "FetchError" as const;
  constructor(public message: string) {}
}

// Effect<Quote, FetchError | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(
    Effect.tryPromise({
      try: () => fetch(url).then((res) => res.json()),
      catch: () => new FetchError(`Failed to fetch ${url}`),
    })
  );
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});

// Effect<Quote | null, never, never>
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
// Effect<Quote, FetchError | ParseResult.ParseError, never>
const program = lastPrice("NN.AS");

// Promise<Quote>
const promise = Effect.runPromise(program);

// Promise<Exit<Quote, FetchError | ParseResult.ParseError>>
const promiseExit = Effect.runPromiseExit(program);

// Quote
const quote = Effect.runSync(program);

// Exit<Quote, FetchError | ParseResult.ParseError>
const quoteExit = Effect.runSyncExit(program);

// RuntimeFiber<Quote, FetchError | ParseResult.ParseError>
Effect.runFork(program);
```

--

The end-to-end program example

<!-- prettier-ignore -->
```ts [|1-3|5-10|12-17|19-24]
class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

// Effect<unknown, FetchError, never>
const effectfulFetch = (...args: Parameters<typeof fetch>) =>
  Effect.tryPromise({
    try: () => fetch(...args).then((res) => res.json()),
    catch: () => new FetchError({ message: `Failed to fetch ${args[0]}` }),
  });

// Effect<Quote, FetchError | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});

export const handler = async (event) => {
  // Effect<Quote, never, never>
  const program = lastPrice("NN.AS").pipe(Effect.orDie);

  return await Effect.runPromise(program);
};
```

---

Dependency Management (Context & Layers)

```ts
// Overly simplified
type Effect<A, E, R> = (context: R) => E | A;
```

- `R` - Dependencies

<!-- prettier-ignore -->
```ts [|14]
import { Effect } from "effect";

const baseUrl = "https://query2.finance.yahoo.com/v8";

// Effect<Quote, FetchError | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});
 
export const handler = async (event) => {
  // Effect<Quote, never, never>
  const program = lastPrice("NN.AS").pipe(Effect.orDie);
 
  return await program.pipe(Effect.runPromise);
};
```

<!-- .element: class="fragment" data-fragment-index="1" -->

--

Let's define a service interface

```ts
interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<Quote, FetchError | ParseResult.ParseError>;
}
```

```ts
import { Context } from "effect";

// Context.Tag<QuoteClient, QuoteClient>
const QuoteClient = Context.GenericTag<QuoteClient>("@effect-app/QuoteClient");
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
  ) => Effect.Effect<Quote, FetchError | ParseResult.ParseError>;
}
const QuoteClient = Context.GenericTag<QuoteClient>("@effect-app/QuoteClient");

// ...
 
export const handler = async (event) => {
  // Effect<Quote, never, QuoteClient>
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
  ) => Effect.Effect<Quote, FetchError | ParseResult.ParseError>;
}
const QuoteClient = Context.GenericTag<QuoteClient>("@effect-app/QuoteClient");

// Effect<Quote, FetchError | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});

export const handler = async (event) => {
  // Effect<Quote, never, QuoteClient>
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
```ts [19,29|10-19|10,14]
import { Effect, Context } from "effect";

interface QuoteClient {
  lastPrice: (
    symbol: string
  ) => Effect.Effect<Quote, FetchError | ParseResult.ParseError>;
}
const QuoteClient = Context.GenericTag<QuoteClient>("@effect-app/QuoteClient");

const baseUrl = "https://query2.finance.yahoo.com/v8";

// Effect<Quote, FetchError | ParseResult.ParseError, never>
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});

export const YahooQuoteClientImpl = Layer.succeed(QuoteClient, { lastPrice });

export const handler = async (event) => {
  // Effect<Quote, never, QuoteClient>
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
```ts [9,10|5|6|15-17|15-17,27]
import { Effect, Config } from "effect";

// Effect<
//   Quote,
//   FetchError | ParseResult.ParseError | ConfigError.ConfigError,
//   never
// >
const lastPrice = (symbol: string) => Effect.gen(function* (_) {
  const baseUrl = yield* _(Config.string("YAHOO_BASE_URL"));
  const url = `${baseUrl}/finance/chart/${symbol}?interval=1d`;
  const json = yield* _(effectfulFetch(url));
  return yield* _(Schema.decodeUnknown(QuoteSchema)(json));
});

const ConfigImpl = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["YAHOO_BASE_URL", "localhost"]]))
);

export const handler = async (event) => {
  // Effect<Quote, never, QuoteClient>
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
// Layer<QuoteClient, never, never>
const LambdaLayer = Layer.merge(YahooQuoteClientImpl, ConfigImpl);

// Scope.CloseableScope
const scope = Effect.runSync(Scope.make());

// Runtime.Runtime<QuoteClient>
const lambdaRuntime = Effect.runSync(
  Scope.use(Layer.toRuntime(LambdaLayer), scope)
);

export const handler = async () => {
  // Effect<Quote, never, QuoteClient>
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

<!-- [279-301|237-240|280|281|286-289|291-293|295,297-298|301|303-307,309|268-277|242-266|243|244-247|248,255,262-263|33-42,44|73-89|76|68-71|62-66|64|48-54|56-60|96-100,102] -->

```ts
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
import { Db, MongoClient, MongoClientOptions } from "mongodb";

const Quote = Schema.struct({
  timestamp: Schema.number,
  close: Schema.number,
  high: Schema.number,
  low: Schema.number,
  open: Schema.number,
  volume: Schema.number,
});
type Quote = Schema.Schema.To<typeof Quote>;

interface InstrumentStore {
  updateQuote: (
    symbol: string,
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

    const updateQuote: InstrumentStore["updateQuote"] = (symbol, quote) =>
      Effect.tryPromise(() =>
        db
          .collection("instruments")
          .findOneAndUpdate({ symbol }, { $set: { quote } })
      ).pipe(Effect.asUnit);

    return InstrumentStore.of({
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

const effectHandler: EffectHandler<
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore
> = (event) =>
  Effect.gen(function* (_) {
    yield* _(Console.log(`Received event: `, event));

    const decodeMessage = Schema.decode(
      Schema.parseJson(Schema.struct({ symbol: Schema.string }))
    );
    const { symbol } = yield* _(decodeMessage(event.Records[0].Sns.Message));

    const bus = yield* _(EventBus);
    const client = yield* _(QuoteClient);
    const store = yield* _(InstrumentStore);

    const quote = yield* _(client.lastPrice(symbol));

    yield* _(store.updateQuote(symbol, quote));
    yield* _(bus.publish("quote_updated", { symbol, quote }));

    yield* _(Console.log(`Successfully processed event`));
  }).pipe(Effect.orDie);

const LambdaLive = Layer.mergeAll(
  SNSEventBusImpl,
  YahooQuoteClientImpl,
  MongoDbInstrumentStoreImpl
);

module.exports.handler = makeLambda(effectHandler, LambdaLive);
```

---

<grid drag="100 45" drop="0 0">
#### Pros & Cons
</grid>

<grid drag="50 45" drop="0 30">
Pros:

- Brings next level of type safety <!-- .element: class="fragment"  -->
- Composable and portable <!-- .element: class="fragment"  -->
- Scalable implementation <!-- .element: class="fragment"  -->
- Easy to test and mock <!-- .element: class="fragment"  -->
- One tool to rule them all <!-- .element: class="fragment"  -->
- Good documentation and community support <!-- .element: class="fragment"  -->
  </grid>

<grid drag="70 45" drop="50 30">
Cons:

- Steep learning curve <!-- .element: class="fragment"  -->
- A bit less readable for beginners <!-- .element: class="fragment"  -->
- Community is still too young <!-- .element: class="fragment"  -->
- Type safety comes with a cost of verbosity <!-- .element: class="fragment"  -->
- Opinionated <!-- .element: class="fragment"  -->
- Brings extra ~190kb to the bundle size (minified & uncompressed) <!-- .element: class="fragment"  -->
  </grid>

---

## Q&A

---

Links

- https://www.effect.website - Effect Website
- https://effect-ts.github.io/effect - Effect Docs
- https://floydspace.github.io/effect-aws - Effectful AWS Docs
- https://github.com/Effect-TS/effect - Effect Github
- https://github.com/floydspace/effect-aws - Effectful AWS Github
