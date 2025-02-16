---
theme: assets/css/nn.css
highlightTheme: css/github-dark-default.css
---

<div style="text-align: center; flex-direction: row; display: flex; justify-content: center; align-items: center;">
	<img src="attachments/effect-logo2.png" alt="My Image" style="filter: invert(1); border: none" />
	<h1 style="font-size: 5em; font-weight: 400">+</h1>
	<img src="attachments/aws-logo.png" alt="My Image" style="box-shadow: none; border: none;" width=400/>
</div>

# Effect for AWS Lambda

and other AWS services

---

#### In this talk

- Introduction and motivation
- How does **@effect-aws/lambda** work
- Effectful AWS SDK clients common implementation
- Future of **effect-aws**

---

<grid drag="30 100" drop="left">
Who am I?
<div style="text-align: right"><B>Victor Korzunin</B></div>
![Image|200](https://avatars.githubusercontent.com/u/5180700)

https://github.com/floydspace
https://x.com/F1oydRose
<img src="attachments/discord-logo.png" alt="My Image" style="box-shadow: none; border: none; width: 70px" />
<img src="attachments/floyd-logo.png" alt="My Image" style="box-shadow: none; border: none; height: 70px" />
</grid>
<grid drag="65 100" drop="right">
- Software Engineer, 9+ years of experience

  - 8+ years with TypeScript
  - 6+ years with Serverless and AWS

- Open-Source Contributor

  - Author of [effect-aws](https://github.com/floydspace/effect-aws)
  - Author of [effect-kafka](https://github.com/floydspace/effect-kafka)
  - Author of [serverless-esbuild](https://github.com/floydspace/serverless-esbuild) plugin

- Ex- professional day-trader
</grid>

---
<!-- slide bg="[[icebreaker.jpg]]" data-background-opacity="0.5" -->
#### How many of you work with AWS?

---
<!-- slide bg="[[motivation.jpg]]" data-background-opacity="0.8" data-background-size="50% 100%" data-background-position="right center" -->

<grid drag="60 100" drop="-50 0">
#### Motivation

- Having the **common implementation**, to not repeat myself when working with AWS lambda and Effect
- Having the **seamless migration** experience from classic AWS Lambda implementation to the Effectful one.
</grid>

notes:
I work a lot with lambda and started many serverless projects, so I collected some common patterns a logic which I prefer to use, and when I started working with Effect I noticed that doing he same job again and again, it is why I decided to extract common logic to a package.

Serverless development lifecycle is sometimes more complex, you have to deploy to the cloud to see actual behaviour one or another aws service, with type safety not only on input and result, but also on error level helps to reduce repetition of deployment and testing in runtime.

It actually applies not only yo effect-aws, but to the effect itself, bc it provides a lot of helpful functions to make your code better without overthinking a spending too much time, Effect team does it for you.

---

<!-- .slide: data-auto-animate -->

Classic lambda example

<!-- [129-150|132-133|135-137|139|141-144|146|147|103-105|107-114|116-126|56-58|92-101|60-90|6-14|16-18|20-39|23-25|27-35|29|49-53] -->
<pre data-id="code-animation"><code data-trim data-line-numbers="6-28|1,6-9|12|2-4,14-16|14,18-22|15,24|16,25|30|6-28">
import type { Handler, SNSEvent } from "aws-lambda";
import { SNSEventBus } from "./bus";
import { YahooQuoteClient } from "./quoteClient";
import { MongoDbInstrumentStore } from "./store";

export const handler: Handler&lt;
  SNSEvent,
  void
&gt; = async (event) => {
  console.info(`Received event: `, event);

  const { symbol } = JSON.parse(event.Records[0].Sns.Message);

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

<pre data-id="code-animation"><code data-trim data-line-numbers="8-32|1-2,8-13|16|4-6,18-20|18,22-26|19,28|20,29|40|34-38">
import { EffectHandler, makeLambda } from "@effect-aws/lambda";
import type { SNSEvent } from "aws-lambda";
import { Console, Effect, Layer, Logger } from "effect";
import { EventBus, SNSEventBusLive } from "./bus";
import { QuoteClient, YahooQuoteClientLive } from "./quoteClient";
import { InstrumentStore, MongoDbInstrumentStoreLive } from "./store";

export const effectHandler: EffectHandler&lt;
  SNSEvent,
  EventBus | QuoteClient | InstrumentStore,
  never,
  void
&gt; = (event) => Effect.gen(function* () {
  yield* Console.info(`Received event: `, event);

  const { symbol } = JSON.parse(event.Records[0].Sns.Message);

  const client = yield* QuoteClient;
  const store = yield* InstrumentStore;
  const bus = yield* EventBus;

  const quote = yield* client.lastPrice(symbol);

  if (!quote) {
    return yield* Console.error("No quote found");
  }

  yield* store.updateQuote(symbol, quote);
  yield* bus.publish("quote_updated", { symbol, quote });

  yield* Console.info(`Successfully processed event`);
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

<pre data-id="code-animation2"><code data-trim class="language-ts">
// Callback way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
  callback: Callback&lt;A&gt;,
) =&gt; void;
</code></pre>

---

<!-- .slide: data-auto-animate -->

Lambda handler

<pre data-id="code-animation2"><code data-trim class="language-ts">
// Callback way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
  callback: Callback&lt;A&gt;,
) =&gt; void;
</code></pre>

<pre data-id="code-animation2"><code data-trim class="language-ts">
// Promise way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
) =&gt; Promise&lt;A&gt;;
</code></pre>

---

<!-- .slide: data-auto-animate -->

Lambda handler

<pre data-id="code-animation2"><code data-trim class="language-ts">
// Callback way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
  callback: Callback&lt;A&gt;,
) =&gt; void;
</code></pre>

<pre data-id="code-animation2"><code data-trim class="language-ts">
// Promise way
type Handler&lt;T = unknown, A = any&gt; = (
  event: T,
  context: Context,
) =&gt; Promise&lt;A&gt;;
</code></pre>

Effect Lambda handler
<pre data-id="code-animation2"><code data-trim class="language-ts">
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

function fromLayer&lt;R, E&gt;(layer: Layer.Layer&lt;R, E&gt;) {
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

Graceful shutdown caveat

<ul>
  <li class="fragment">Lambda supports <strong>graceful shutdown</strong> only for a functions with <strong>registered extensions</strong></li>
  <li class="fragment">Lambda environment lifecycle
  <img src="https://docs.aws.amazon.com/images/lambda/latest/dg/images/Overview-Successful-Invokes.png" alt="My Image" style="box-shadow: none; border: none;"></li>
  <li class="fragment">The easiest way to enable it is using <strong>LambdaInsightsExtension</strong> lambda layer</li>
</ul>

<div class="fragment" style="margin-top: 50px">DEMO</div>

---

Benefits of **@effect-aws/lambda**

- Familiar interface provides clean implementation. <!-- .element: class="fragment"  -->
- Type-safe lambda handler and dependencies. <!-- .element: class="fragment"  -->
- Shared effect runtime among invocations. <!-- .element: class="fragment"  -->
- Graceful shutdown. <!-- .element: class="fragment"  -->
- Portable, aka Effectful. <!-- .element: class="fragment"  -->

---

Effectful AWS SDK clients

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="1,4-10">
import { SNS } from "@aws-sdk/client-sns";

const handler = async () => {
  const topicArn = process.env.TOPIC_ARN!;
  const sns = new SNS();

  await sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
};

module.exports.handler = handler;
</code></pre>

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="1,6-12|7,9,12">
import { SNS } from "@effect-aws/client-sns";
import { makeLambda } from "@effect-aws/lambda";
import { Config, Effect } from "effect";

const handler = () => Effect.gen(function* () {
  const topicArn = yield* Config.string("TOPIC_ARN");
  const sns = yield* SNS;

  yield* sns.publish({
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
}).pipe(
  Effect.provide(SNS.defaultLayer),
  Effect.orDie
);

module.exports.handler = makeLambda(handler);
</code></pre>

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="8,11|13">
import { SNS } from "@effect-aws/client-sns";
import { makeLambda } from "@effect-aws/lambda";
import { Config, Effect } from "effect";

const handler = () => Effect.gen(function* () {
  const topicArn = yield* Config.string("TOPIC_ARN");

  yield* SNS.publish({ // service accessor
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
}).pipe(
  Effect.provide(SNS.defaultLayer),
  Effect.orDie
);

module.exports.handler = makeLambda(handler);
</code></pre>

note:

However as of Patrick explanation, the direct accessors should be used carefully, it could cause requirements leakage.

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="13">
import { SNS } from "@effect-aws/client-sns";
import { makeLambda } from "@effect-aws/lambda";
import { Config, Effect } from "effect";

const handler = () => Effect.gen(function* () {
  const topicArn = yield* Config.string("TOPIC_ARN");

  yield* SNS.publish({ // service accessor
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
}).pipe(
  Effect.provide(SNS.layer({ region: "eu-central-1" })),
  Effect.orDie
);

module.exports.handler = makeLambda(handler);
</code></pre>

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="13">
import { SNS } from "@effect-aws/client-sns";
import { makeLambda } from "@effect-aws/lambda";
import { Config, Effect } from "effect";

const handler = () => Effect.gen(function* () {
  const topicArn = yield* Config.string("TOPIC_ARN");

  yield* SNS.publish({ // service accessor
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
}).pipe(
  Effect.provide(SNS.baseLayer(() => new SNSClient({ region: "eu-central-1" }))),
  Effect.orDie
);

module.exports.handler = makeLambda(handler);
</code></pre>

---

<!-- .slide: data-auto-animate -->

SNS client example

<pre data-id="code-animation3"><code class="language-typescript" data-trim data-line-numbers="8">
import { SNS } from "@effect-aws/client-sns";
import { makeLambda } from "@effect-aws/lambda";
import { Config, Effect } from "effect";

const handler = () => Effect.gen(function* () {
  const topicArn = yield* Config.string("TOPIC_ARN");

  yield* SNS.publish({ // service accessor
    TopicArn: topicArn,
    Message: JSON.stringify({ symbol: "NN.AS", price: 42 }),
  });
}).pipe(
  Effect.provide(SNS.baseLayer(() => new SNSClient({ region: "eu-central-1" }))),
  Effect.orDie
);

module.exports.handler = makeLambda(handler);
</code></pre>

<img src="attachments/Screenshot 2025-02-16 at 19.19.32.png" style="position: absolute; top: 195px; left: 225px">

---

Future of **effect-aws**

<ul>
  <li class="fragment">Generate all clients</li>
  <li class="fragment">Implement X-Ray tracing to support Effect spans</li>
  <li class="fragment">Port <a href="https://docs.powertools.aws.dev/lambda/typescript/latest/">AWS Powertools for Lambda</a> to Effect</li>
  <li class="fragment">Middlewares for <strong>@effect-aws/lambda</strong> (<a href="https://middy.js.org">Middy</a> inspiration)</li>
  <li class="fragment">Http Api lambda builder</li>
</ul>
<div class="fragment" style="display: flex; margin-top: 50px">
<iframe src="https://ghbtns.com/github-btn.html?user=floydspace&repo=effect-aws&type=star&count=true&size=large" frameborder="0" scrolling="0" width="150" height="30" title="GitHub"></iframe>

<iframe src="https://ghbtns.com/github-btn.html?user=floydspace&repo=effect-aws&type=fork&count=true&size=large" frameborder="0" scrolling="0" width="140" height="30" title="GitHub"></iframe>

<iframe src="https://ghbtns.com/github-btn.html?user=floydspace&type=follow&count=true&size=large" frameborder="0" scrolling="0" width="280" height="30" title="GitHub"></iframe>

<iframe src="https://ghbtns.com/github-btn.html?user=floydspace&type=sponsor&size=large" frameborder="0" scrolling="0" width="215" height="30" title="GitHub"></iframe>
</div>
%% <iframe class="fragment" src="https://github.com/sponsors/floydspace/button" title="Sponsor floydspace" height="32" width="120" style="border: 0; border-radius: 6px; margin-top: 30px"></iframe> %%




---

## Q&A

---

#### Kudos

- Contributors
  - https://github.com/godu - Arthur Weber
  - other contributors
- **effect-aws** users
- Effect Team

#### Links <!-- .element: class="fragment" data-fragment-index="1" -->

<ul class="fragment" data-fragment-index="1">
  <li><a href="https://github.com/floydspace/effect-aws">https://github.com/floydspace/effect-aws</a> - Effectful AWS Github</li>
  <li><a href="https://floydspace.github.io/effect-aws">https://floydspace.github.io/effect-aws</a> - Effectful AWS Docs</li>
</ul>

note:

other contributors:

- Chris Balla - for contributing with new clients
- Joep Joosten - for attempt of improving code generator and thinking along
- Florian Bischoff - for sharing ideas and suggestions
- Ryan McDaniel


I wouldn't be here if you would not use it.

---

<grid drag="50 100" drop="left">
# Thank you!
</grid>
<grid drag="50 100" drop="right">
![[website-qr.png|300]] <!-- .element: style="box-shadow: none; border: none;" -->
<div style="display: flex; flex-direction: column; align-items: flex-start;">
<div><img src="attachments/x-logo.svg" width="30" style="box-shadow: none; border: none; vertical-align: middle; margin-right: 20px;"> <span>/F1oydRose</span></div>
<div><img src="attachments/github-mark.svg" width="30" style="box-shadow: none; border: none; vertical-align: middle; margin-right: 20px;"> <span>/floydspace</span></div>
<div><img src="attachments/discord-logo.svg" width="30" height="30" style="box-shadow: none; border: none; vertical-align: middle; margin-right: 20px;"> <span>/victor.korzunin</span></div>
</div>
</grid>