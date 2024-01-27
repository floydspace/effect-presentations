import { Data, Effect } from "effect";

export class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
}> {}

export const effectfulFetch = (...args: Parameters<typeof fetch>) =>
  Effect.tryPromise({
    try: () => fetch(...args).then((res) => res.json()),
    catch: () => new FetchError({ message: `Failed to fetch ${args[0]}` }),
  });
