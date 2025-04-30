import { LambdaHandler } from "@effect-aws/lambda";
import { Logger } from "@effect-aws/powertools-logger";
import { Tracer } from "@effect-aws/powertools-tracer";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  HttpServer,
} from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
import { InstrumentStore, MongoDbInstrumentStoreLive, Quote } from "./store";

const getHello = HttpApiEndpoint.get("hello-world")`/hello`.addSuccess(
  Schema.String
);

const healthGroup = HttpApiGroup.make("health").add(getHello);

const symbolParam = HttpApiSchema.param("symbol", Schema.String);

const getQuote = HttpApiEndpoint.get(
  "getQuote"
)`/quote/${symbolParam}`.addSuccess(Quote);

const quotesGroup = HttpApiGroup.make("quotes").add(getQuote);

const MyApi = HttpApi.make("MyApi").add(healthGroup).add(quotesGroup);

// Implement the "health" group
const HealthLive = HttpApiBuilder.group(MyApi, "health", (handlers) =>
  handlers.handle("hello-world", () => Effect.succeed("Hello, World!"))
);

// Implement the "quotes" group
const QuotesLive = HttpApiBuilder.group(MyApi, "quotes", (handlers) =>
  handlers.handle("getQuote", ({ path }) =>
    Effect.gen(function* () {
      const store = yield* InstrumentStore;

      return yield* store.getQuote(path.symbol);
    }).pipe(Effect.orDie, Effect.withSpan("quotes.getQuote"))
  )
);

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(
  Layer.provide(QuotesLive),
  Layer.provide(MongoDbInstrumentStoreLive),
  Layer.provide(HealthLive)
);

const PowerToolsLive = Layer.merge(
  Logger.layer({ serviceName: "effect-app" }),
  Tracer.layer({ serviceName: "effect-app" })
);

export const handler = LambdaHandler.fromHttpApi(
  Layer.mergeAll(
    MyApiLive,
    // you could also use NodeHttpServer.layerContext, depending on your
    // server's platform
    HttpServer.layerContext
  ).pipe(Layer.provideMerge(PowerToolsLive))
);
