import type { Context } from "aws-lambda";
import { Effect, Layer, Runtime } from "effect";
import { fromLayer } from "./runtime";

export type EffectHandler<T, R, E = never, A = void> = (
  event: T,
  context: Context
) => Effect.Effect<R, E, A>;

export function makeLambda<T, R, E1, E2, A>(
  handler: EffectHandler<T, R, E1, A>,
  globalLayer: Layer.Layer<never, E2, R>
) {
  const runtimePromise = fromLayer(globalLayer);
  return async (event: T, context: Context) => {
    const runPromise = Runtime.runPromise(await runtimePromise);
    return handler(event, context).pipe(runPromise);
  };
}
