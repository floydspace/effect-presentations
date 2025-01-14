---
theme: css/nn.css
highlightTheme: css/github-dark-default.css
# transition: concave
---

<div style="text-align: center; flex-direction: row; display: flex; justify-content: center; align-items: center;">
<img src="attachments/effect-logo2.png" alt="My Image" style="filter: invert(1); border: none" />
<img src="attachments/plus-sign.png" alt="My Image" style="box-shadow: none; border: none;" width=100/>
<img src="attachments/aws-logo.png" alt="My Image" style="box-shadow: none; border: none;" width=400/>
</div>

# Effect
## for AWS Lambda

and other AWS services

---
Agenda

- Introduction and motivation
- How does **@effect-aws/lambda** work
- Effectful AWS SDK clients common implementation
- Future of **effect-aws**

---

<!-- <grid drag="70 0" drop="20 10">
</grid> -->
<grid drag="30 70" drop="0 10">
Who am I?
<div style="text-align: right"><B>Victor Korzunin</B></div>
<img src="https://avatars.githubusercontent.com/u/5180700" alt="My Image" style="border: none; width: 200px" />
</grid>
<grid drag="100 45" drop="25 30">

- Software Engineer, 9+ years of experience

  - 8+ years with TypeScript
  - 6+ years with Serverless and AWS

- Open-Source Contributor

  - Author of [serverless-esbuild](https://github.com/floydspace/serverless-esbuild) plugin
  - Author of [effect-aws](https://github.com/floydspace/effect-aws)

- Ex- professional trader

    </grid>
    <grid drag="30 140" drop="0 10">

https://github.com/floydspace
https://x.com/F1oydRose
</grid>

---
How many of you work with AWS?

---

Motivation

- Having something ready to use without spending much time reimplementing **scalable** and **efficient** solutions
- Serverless supposed to be used for **quick start**, I wanted to keep the same energy when working with Effect
- Make working with lambda function even more **type-safe**, to deal with less bugs in runtime.

notes:
I work a lot with lambda and started many serverless projects, so I collected some common patterns a logic which I prefer to use, and when I started working with Effect I noticed that doing he same job again and again, it is why I decided to extract common logic to a package.

Serverless development lifecycle is sometimes more complex, you have to deploy to the cloud to see actual behaviour one or another aws service, with type safety not only on input and result, but also on error level helps to reduce repetition of deployment and testing in runtime.

It actually applies not only yo effect-aws, but to the effect itself, bc it provides a lot of helpful functions to make your code better without overthinking a spending too much time, Effect team does it for you. 

---
<!-- .slide: data-auto-animate -->
Classic lambda example
<!-- [129-150|132-133|135-137|139|141-144|146|147|103-105|107-114|116-126|56-58|92-101|60-90|6-14|16-18|20-39|23-25|27-35|29|49-53] -->
<pre data-id="code-animation"><code data-trim data-line-numbers="7-30|1,7-10|2,13-14|3-5,16-18|16,20-24|17,26|18,27|32|7-30">
import type { Handler, SNSEvent } from "aws-lambda";
import { z } from "zod";
import { SNSEventBus } from "./bus";
import { YahooQuoteClient } from "./quoteClient";
import { MongoDbInstrumentStore } from "./store";

export const handler: Handler&lt;
  SNSEvent,
  void
&gt; = async (event) => {
  console.info(`Received event: `, event);

  const message = JSON.parse(event.Records[0].Sns.Message);
  const { symbol } = z.object({ symbol: z.string() }).parse(message);

  const client = new YahooQuoteClient();
  const store = await MongoDbInstrumentStore.init();
  const bus = new SNSEventBus();

  const quote = await client.lastPrice(symbol);

  if (!quote) {
    return console.error("No quote found");
  }

  await store.updateQuote(symbol, quote);
  await bus.publish("quote_updated", { symbol, quote });

  console.info(`Successfully processed event`);
};

module.exports.handler = handler;

</code></pre>

---
<!-- .slide: data-auto-animate -->
Effect lambda example

<pre data-id="code-animation"><code data-trim data-line-numbers="8-35|1-2,8-13|3,16-19|4-6,21-23|21,25-29|22,31|23,32|43|37-41">
import { EffectHandler, makeLambda } from "@effect-aws/lambda";
import type { SNSEvent } from "aws-lambda";
import { Effect, Layer, Logger, Schema } from "effect";
import { EventBus, SNSEventBusLive } from "./bus";
import { QuoteClient, YahooQuoteClientLive } from "./quoteClient";
import { InstrumentStore, MongoDbInstrumentStoreLive } from "./store";

export const effectHandler: EffectHandler&lt;
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore,
  never,
  void
&gt; = (event) => Effect.gen(function* () {
  yield* Effect.logInfo(`Received event: `, event);

  const decodeMessage = Schema.decode(
    Schema.parseJson(Schema.Struct({ symbol: Schema.String }))
  );
  const { symbol } = yield* decodeMessage(event.Records[0].Sns.Message);

  const client = yield* QuoteClient;
  const store = yield* InstrumentStore;
  const bus = yield* EventBus;

  const quote = yield* client.lastPrice(symbol);

  if (!quote) {
    return yield* Effect.logError("No quote found");
  }

  yield* store.updateQuote(symbol, quote);
  yield* bus.publish("quote_updated", { symbol, quote });

  yield* Effect.logInfo(`Successfully processed event`);
}).pipe(Effect.orDie);

const LambdaLive = Layer.mergeAll(
  SNSEventBusLive,
  YahooQuoteClientLive,
  MongoDbInstrumentStoreLive
).pipe(Layer.provideMerge(Logger.json));

module.exports.handler = makeLambda(effectHandler, LambdaLive);
</code></pre>

note:
I want to start with **@effect-aws/lambda** package, bc it is a starting point of all the solutions

---
<!-- .slide: data-auto-animate -->
Lambda handler

<pre data-id="code-animation2"><code data-trim data-line-numbers="1-5">
// Promise way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
) =&gt; Promise&lt;A&gt;;
</code></pre>
---
<!-- .slide: data-auto-animate -->
Effect Lambda handler

<pre data-id="code-animation2"><code data-trim data-line-numbers="1-5">
// Effect way
type EffectHandler&lt;T, R, E = never, A = void&gt; = (
  event: T,
  context: Context,
) =&gt; Effect.Effect&lt;A, E, R&gt;;
</code></pre>

---

<!-- .slide: data-auto-animate -->
Effect Lambda handler
<pre data-id="code-animation2"><code class="language-typescript" data-trim data-line-numbers="7-19|8-9|11-13|21-40|22,39|16-17|29,36-37">
// Effect way
type EffectHandler&lt;T, R, E = never, A = void&gt; = (
  event: T,
  context: Context,
) =&gt; Effect.Effect&lt;A, E, R&gt;;

function makeLambda&lt;T, R, E1, E2, A&gt;(
  handler: EffectHandler&lt;T, R, E1, A&gt;,
  globalLayer?: Layer.Layer&lt;R, E2&gt;,
): Handler&lt;T, A&gt; {
  const globalRuntime = globalLayer
    ? fromLayer(globalLayer)
    : Promise.resolve(Runtime.defaultRuntime as Runtime.Runtime&lt;R&gt;);

  return async (event: T, context: Context) =&gt; {
    const runPromise = Runtime.runPromise(await globalRuntime);
    return handler(event, context).pipe(runPromise);
  };
}

function fromLayer &lt;R, E&gt;(layer: Layer.Layer&lt;R, E&gt;) {
  const rt = ManagedRuntime.make(layer);

  const signalHandler: NodeJS.SignalsListener = (signal) =&gt; {
    Effect.runFork(
      Effect.gen(function* () {
        yield* Console.log(`[runtime] ${signal} received`);
        yield* Console.log("[runtime] cleaning up");
        yield* rt.disposeEffect;
        yield* Console.log("[runtime] exiting");
        yield* Effect.sync(() =&gt; process.exit(0));
      })
    );
  };

  process.on("SIGTERM", signalHandler);
  process.on("SIGINT", signalHandler);

  return rt.runtime();
}
</code></pre>
---

Benefits of **@effect-aws/lambda**

- Familiar interface provides clean implementation.
- Type-safe lambda handler and dependencies.
- Graceful shutdown from the box.
- Portable.

---

Future of **effect-aws**

- tracing
- improve code generator

---

## Q&A

---

Links

- https://github.com/floydspace/effect-aws - Effectful AWS Github
- https://floydspace.github.io/effect-aws - Effectful AWS Docs
