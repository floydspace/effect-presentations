---
theme: blood
---

<style>
.reveal code.tsx {
  font-size:  1em;
  line-height: 1.5em;
}
.reveal code.ts {
  font-size:  .6em;
  line-height: 1em;
}
.reveal code.js {
  font-size:  .8em;
  line-height: 1em;
}
</style>

![[effect-logo.png]]
# Effect
### Next-Generation Typescript

notes:
Hi, I'm Ethan and this video is an introduction to 'Effect', a typescript library to help developers easily create the complex programs of today.

We are stuck with javascript (and all of its quirks) whether we like it or not, 
typescript has been a big step, but the privatives its built on are still fundamentally flawed. it's time to build with a library designed to handle the complexity of modern development

---

How often have you seen this kind of code?

```tsx
async function getData(): Data {
	const response = await fetch("https://api.example.com/foo");
	const json = await response.json();
	return dataSchema.parse(json);
}
```

What problems are there here?

notes:
How often have you seen this kind of code?
What problems might there be here?
The biggest problem is that this function could crash your program, but doesn't feel the need to tell you

---

```tsx
async function getData(): Data {
	const response = await fetch("...");
	const json = await response.json();
	return dataSchema.parse(json);
}
```

1.  `fetch` can reject
2.  `json` can reject
3.  `parse` can throw
4.  each of these is a different kind of error that may be handled differently

notes:
Unsafe assumptions crash our programs at runtime and wake us up at 4am.

---

```tsx
let data: Data;
try {
	data = getData();
} 
catch (exception: unknown) {
	switch(exception) { /* ... */ }
 }
```

How sure are you that you won't forget to catch

notes:
handling these cases properly in vanilla typescript is less than ideal. what if you forget to try/catch? what if you forget one of the possible errors?

---


```tsx
function getData(): Effect.Effect<never, never, Data> {
  return pipe(
    Effect.tryPromise(() => fetch("https://api.example.com/foo")),
    Effect.orDie,
    Effect.flatMap((res) => Effect.tryPromise(() => res.json())),
    Effect.orDie,
    Effect.map((json) => Effect.try(() => dataSchema.parse(json))),
    Effect.orDie
  );
}
```

Note the `orDie()s`.

notes:
This is exactly as unsafe as the original function, but the three places it can crash are now explicitly stated.
If you want it to never crash, you find alternatives for those .orDie()s

Here's an verbose version of what that might look like

---

A verbose Effect solution

```ts
function getData(): Effect.Effect<
  never,
  FetchError | JSONError | ParseError,
  Data
> {
  return pipe(
    Effect.tryCatchPromise(
      () => fetch("https://api.example.com/foo"),
      () => new FetchError()
    ),
    Effect.flatMap((res) =>
      Effect.tryCatchPromise(
        () => res.json(),
        () => new JSONError()
      )
    ),
    Effect.flatMap((json) =>
      Effect.tryCatch(
        () => dataSchema.parse(json),
        () => new ParseError()
      )
    )
  );
}
```

notes:
I know this may seem like a lot, but this is mostly caused by having to work around existing apis that are designed around try/catch.

It takes a bit of work at the weeds, but once your into the Effect world things become much easier

---

An idiomatic Effect solution

```tsx
function getData(): Effect.Effect<
  never,
  FetchError | JSONError | ParseError,
  Data
> {
  return pipe(
    fetchDataToEffect(),
    Effect.flatMap((rawData) => dataSchema.parseToEither(rawData))
  );
}
```

Errors automatically bubble up to form a separate 'happy' and 'error' path


notes:
An idiomatic Effect solution looks like this.
Don't worry too much about the specifics here.
We'll talk about basic Effect types and functions soon.

I just wanted to give you a taste.

---

## Problems today:
- ## Javascript

notes:
The love/hate relationship with javascript is something most developers share, you can't seem to escape it. The language has grown a lot, with new modern features and typescript making development surprising pleasant. But the pain points are still there.


---

Effect brings typescript up another level, providing powerful primitives to make writing **safe**, **asynchronous**, **resourceful**, **composable**, **concurrent**, and **observable** programs easier than ever before.

---

## Isn't typescript already safe?

notes:
Lets start with type safety. 

---

```tsx
type SomeFn = () => T
```
Could this function throw? If so, what is the type of the thrown error?

```tsx
type SomeAsyncFn = () => Promise<T>
```
Could this promise reject? If so, what type is returned?

notes:
What's the problem with these two types? ...theyre only generic over one parameter

Typescript gives us the illusion of safety, but once things go off the happy path your left in the dark.

I am here to tell you that it doesn't have to be that way.

---

### The Effect Type

```tsx
type Effect<Requirements, Error, Value> = (
	context: Context<Requirements>
) => Error | Value
```

notes:
The Effect type is the core of the entire Effect ecosystem.

It encapsulates the logic of a program that requires some Requirements to execute. This program can either fail, producing an error of type `Error`, or succeed, yielding a value of type `Value`.

Although their actual implementation is more complex than this, it can be helpful to think of `Effect` as a function that takes in requirements as arguments and returns either a value or an error

---

Promises kind of suck...

notes:
Asynchronous code is everywhere in modern apps, but the `Promise` primitive leaves a lot to be desired

- Promises are Eagerly executed, meaning they begin execution immediately on creation. This means they can never be used to represent a computation, only an already running computation that might have already completed and produced a value.
- Also, the value produced by the Promise is implicitly memoized, meaning that when the Promise is settled, the internal state of the Promise is frozen and can't be changed anymore, whether the Promise is fulfilled or rejected. Consequently if you want to run the same computation again, you'll need to recreate the entire Promise from scratch.

---

An Effect is a description of a program

```tsx
// Effect<never, never, number>
const program = Effect.sync(() => {
	console.log("Hello, World!");
	return 1;
})
Effect.runSync(program) // 1
```

notes:
The `Effect` data type represents an **immutable** value that **lazily** describes a workflow or job, and all Effect functions produce new `Effect` values.

`Effect` values do not actually do anything, they are just values that model or describe effectful interactions.

An `Effect` can be interpreted by the Effect Runtime System into effectful interactions with the external world.

---

## `Effect` enables incredible things

notes:
If your like me, your mind is probably racing at this point. I am now going to give you a tour of some of the things that the Effect ecosystem offers, don't worry about the specifics, I'll go into more depth in future videos, just get an idea of what is possible.

---

## Error handling

```tsx
// Effect<never, BazError, string>
const recovered = pipe(
  program, // Effect<never, FooError | BarError | BazError, string>
  Effect.catchTag("FooError", (fooError) =>
    Effect.succeed("Recovering from FooError")
  ),
  Effect.catchTag("BarError", (barError) =>
    Effect.succeed("Recovering from BarError")
  )
);
```

notes:
now that errors are in their own dedicated channel and clearly separated by type it becomes trivial to handle errors case by case, all at once, or to let them bubble up to the next effect 

---

## Dependecy Injection

```tsx
async function getUserFromDB(userId: number) {
	return await db.user.getById(userId);
}
```

notes:
Whats wrong with this snippet?

Well nothing, until you want to swap your live db client for a local test one.

Sure we could go full pure functional programming and pass every possible dependency as an argument, but that quickly becomes unrealistic

Effect provides a better way

---

Dependency Injection

```tsx
type DBClient = {
	user: { getById(userId: number): User }
}
const DBClient = Context.Tag<DBClient>();

// returns Effect.Effect<DBClient, never, User>
function getUserFromDB(userId: number) {
	return pipe(
		DBClient,
		Effect.map((db) => db.user.getById(userId))
	)
}
```

notes:

A `Tag` in effect is a placeholder for a dependency of some type. We can use the Tag just as if it was the actual implemented object in our Effects without ever actually implementing it. Doing so causes that type to appear in the `Requirements` field of the resulting effect.

This tells the effect runtime that you must provide a implementation that matches the defined type before the program can be run. This can be done flexibly anywhere in your program, meaning it becomes simple to swap out the implementation of a dependency when required.

---

## Dependency Dependencies

```mermaid
graph TD
  MeasuringCup --> Flour
  MeasuringCup --> Sugar
  Flour --> Recipe
  Sugar --> Recipe
```

```tsx
type ReceipeImplementation = Layer<Flour | Sugar, never, Recipe>
```

notes:
Modern apps are complex, often involving complex Dependency hierarchies. To account for this Effect provides `Layer` a type describing a blueprint for construction of a set of requirements. It takes some requirements in, may produce some error, and yields some requirements out.

---

## Resource Management

```tsx
// Effect<Scope, DBConnectionError, DataBase>
const database = Effect.acquireRelease(connectToDB, disconnectFromDB)
```

notes:
Resources in our applications may require  lifetime related logic.

The `Scope` data type is fundamental for managing resources safely and in a composable manner in Effect.

In simple terms, a scope represents the lifetime of one or more resources. When a scope is closed, the resources associated with it are guaranteed to be released.

---

## Logging

```tsx
const program = Effect.log("Application started")
Effect.runSync(program)
/*Output:timestamp=2023-07-05T09:14:53.275Z level=INFO
fiber=#0 message="Application started"*/
```

notes:
Modern applications require observability for us to know what is going on within them.

Effect provides powerful logging capabilities, with different levels such as debug, info, warning and error, as well as the able to provide a custom logger that can do more than just a simple console.log.

---

### Resilience on Failures

```js
const schedule = pipe(
	Schedule.exponential(Duration.millis(10)),
	Schedule.jittered,
	Schedule.whileOutput((n) => Duration.lessThan(n, Duration.millis(100)))
)
Effect.runPromise(Effect.repeat(logDelay, schedule))
/*
delay: 3
delay: 18
delay: 24
delay: 48
delay: 92
*/
```

notes:

Effect provides a powerful, composable scheduling toolkit for when you want to run an Effect more than once

Have you ever tried implementing jittered exponential backoff?

How many lines of vanilla typescript would it take you to build the same functionality as this snippet?

---

### Concurrency

```tsx
const promises = userIds.map(fetchUser);
const users = Promise.all(promises);
```

notes:
This code works while your meager startup only has 5 users, but what about when it grows to hundreds or thousands. That many requests will crash your users' devices. and remember promises, are eagerly executed so to solve this problem we'ed have to make some crazy promise factory async queue to control the level of parallelism

or we could use effect

---

Controlled Concurrency

```tsx
const users = pipe(
	Effect.collectAllPar(() => userIds.map(fetchUserEffect)),
	Effect.withParallelism(10)
)
```

notes:

It really is this easy. Effects `fiber` based runtime manages everything for you.

---
### Fibers + Interruption
```tsx
const program = pipe(
  Effect.logInfo("start"),
  Effect.flatMap(() => Effect.sleep(Duration.seconds(2))),
  Effect.flatMap(() => Effect.interrupt()),
  Effect.flatMap(() => Effect.logInfo("done"))
)
Effect.runPromise(program).catch((error) =>
  console.log(`interrupted: ${error}`)
)
// timestamp=...885Z level=INFO fiber=#0 message=start
// interrupted: All fibers interrupted without errors.
```

notes:
Lightweight threads of execution called `fibers` power effects runtime. Think of a fiber as a worker that performs a specific job. It can be started, paused, resumed, and even interrupted.

Effect also seamlessly integrates with existing interruption APIs such as AbortController

Working with Fibers directly is an advanced usecase you probably wont need for a while when starting out

---

### The Ecosystem is Massive

- Configuration
- Metrics
- Schema Validation
- Custom Data Structures
- Pattern Matching
- Caching
- ... SO MUCH MORE

notes:
It feels like the Effect authors have thought of nearly everything under the sun. The Effect ecosystem is massive and provides tools to handle nearly every facit of modern application development.

---

### Effect is fully interoperable with existing code.

notes:
By now you might have thought back to other projects aimed at 'doing typescript better', that all which ultimately fell to the same fate, a lack of easy interop with the vast and unavoidable existing javascript ecosystem

Not Effect. While it would be awesome to write applications that are 'Effect all the way down', you are by no means forced to.

Just want to rewrite a single endpoint that does some complicated parallel async work? You can do it with Effect today.

Just want to take advantage of one of Effects useful data structures? You can do it with Effect today.

---

### Generators

```js
async function program() {
  const [a, b] = await Promise.all([Promise.resolve(10), Promise.resolve(2)])
  const n1 = await divide(a, b)
  const n2 = increment(n1)
  return `Result is: ${n2}`
}
 
console.log(await program()) // Output: "Result is: 6"

const program = Effect.gen(function* (_) {
  const [a, b] = yield* _(Effect.all(Effect.succeed(10), Effect.succeed(2)))
  const n1 = yield* _(divide(a, b))
  const n2 = increment(n1)
  return `Result is: ${n2}`
})
 
console.log(Effect.runSync(program)) // Output: "Result is: 6"
```

notes:
And if you think you could get out of using Effect because 'functional programming is too different and too difficult', think again. Effect has its own form of 'async-await' style syntax powered by generators. With generators you can write effectful code in the imperative way you already know.

---


![[effect-logo.png]]
# Effect
### Next-Generation Typescript

notes:

Effect is still young, but ready to power the typescript applications of today and tomorrow.

I hope you feel inspired to give the Effect documentation a read, and to explore the Effect repositories and API Reference pages.

Consider joining the Effect discord server, a great community for learning and discussing effect.

Links to all of that as well as the transcript and markdown sourcecode to this video are available in the description

And corrections are in the pinned comment.

Finally a big thank you and shoutout to no boilerplate, to whom this video takes very strong inspiration from.

His videos are incredible and inspired my passion for rust, just like I hope this video will inspire your passion for Effect.

Please check out his channel link also in description.

Thank so much for watching, see you next time.

---
