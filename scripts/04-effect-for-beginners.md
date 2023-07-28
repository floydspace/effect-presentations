---
theme: blood
highlightTheme: css/vs2015.css
---
# Effect for Beginners
![[effect-logo.png]]
### A guide through Effect's core concepts

notes:
Effect is a typescript library that gives you the tools to make it easy to write complex applications in a safe and composable manner. This video is a detailed introductory guide to the core effect concepts.

We'll start with the basics and then move on to slowly build an example program piece by piece, which by the end will feature concurrent asynchronous work, granular error handling, dependency injection and benchmarking.

If you are still curious about why Effect is worth learning, feel free check out my other videos on Effect linked in the cards now, and come back after.

---

Sponsored By: \
The Effect Team

notes:
Effect is an amazing library and I want to quickly thank the Effect team for financially supporting the creation of content around it. Now on to the tutorial!

---
```
npm install effect
yarn add effect
pnpm add effect
```
```ts
import { Effect } from "effect"
```
notes:
First, make sure to add the effect package to your project using your package manager of choice
with that out of the way lets get to business

---

```ts
type Effect<Requirements, Error, Value> = (
  requirements: Requirements
) => Error | Value;
```

notes:
We'll begin with the Effect type. This type is the center of the enitre Effect ecosystem.

The Effect type is generic over 3 parameters which describe its behavior. Requirements, Error, and Value.

You should conceptualize an Effect as a function that takes in its requirements as an argument and returns either a value or an error.

Its important to emphasize this function-like nature of an Effect. Just like creating a function doesn't execute it's body, constructing an effect doesn't execute it's content, we could say that an effect is a description of a program. The output value is computed only when the Effect is ran.

---

The unit `Effect`
```ts
type Unit = Effect<never, never, void>;

// can think of being like
const unit = () => {}
```

notes:
The unit effect is the most basic Effect type. It describes a program that has requirements of type never, meaning it does not have any dependencies. It has a error also of type never, meaning it will never error, and it has a value of type void, meaning it does not return any value.

---

A simple `Effect`
```ts
type Simple = Effect<never, Error, number>;
```

notes:
Lets break down this effect. Like the unit effect, its requirements field is never. However, unlike the unit effect, its Error type is Error, this means that this Effect may fail with an Error object. The final value type is number, meaning this Effect will yield a number if it succeeds.

---

Creating Effects
```ts
// type: Effect<never, never, number>
const success = Effect.succeed(42);

// type: Effect<never, Error, never>
const failure = Effect.fail(new Error())
```

notes:
To create an Effect from a value we can use the succeed and fail constructor functions. Succeed takes a value and returns an Effect that can only ever succeed with that value. Along the same lines, fail takes a value and returns an Effect that can only ever fail with that value.

---
Effects compose together
```ts
function divide(x: number, y: number): Effect.Effect<never, Error, number> {
  if (y === 0) {
    return Effect.fail(new Error("divide by zero"));
  }
  return Effect.succeed(x / y);
}
```

notes:
The power of the Effect type comes from its ability to compose together with other Effects. Here is a basic division function. First it checks if the divisor is 0, and if so returns a effect failure containing an Error. Else it returns a effect success containing the result of the division.

In the return type is where the magic happens. See how both the success case and the failure case merge into a single type that describes both outcomes. It is now abundantly clear that a result of this divide function is an effect that when run will yield either a number or an Error.

---

Delaying Computations

```ts
const log = Effect.succeed(console.log("dont do this"));
```

notes:
Remember how an Effect represents the description of some behavior to be ran at a later point. Well, when we use the succeed and fail constructors, the value passed to them is evaluated when the effect is constructed, not when it is run. 

However, when working with code that has side effects, it might be important to defer those side effects until the effect is run.

---

Synchronous computations
```ts
// type: Effect<never, never, number>
const program = Effect.sync(() => {
  console.log("Hello, World!") // side effect
  return 42 // return value
})
```

notes:
To do this we can use the sync constructor. Sync returns an Effect with a value of the return type of the passed function, but this function is only ran when the Effect itself is ran.

Here this Effect represents a program that when run will log to the console and return a number.

Its important to note that sync always returns an Effect with a error of type never, this is because the function passed to it should be guaranteed to never throw.

---
Synchronous computations that could throw
```ts
// type: Effect<never, Error, any>
const program = Effect.try({
  try: () => JSON.parse(""),
  catch: (_caughtError) => new Error("JSON.parse threw an error"),
});
```

notes:
However, non Effect code will throw errors, and thats ok. The try constructor catches errors thrown from the passed try function and passes them to a catch function where you can construct the value to place in the error channel of the resulting effect.

Here JSON.parse will throw if the input is invalid json, such as this empty string. If so we create a new error with a custom message.

Like sync, the resulting effect has a value of the return type of the passed try function, in this case any, and the error is of type Error, the return type of our catch function. 

---

Asynchronous computations
```ts
// type: Effect<never, never, number>
const promise = Effect.promise(() => Promise.resolve(42));
```

notes:
To model an asynchronous computation we can use the promise constructor. Notice how the resulting Effect returns a number and not a Promise of a number. This is because Effect handles the asynchronous aspect for you, so you only have to worry about the resulting type.

Just like with `sync` its crucial that the promise returned from the function passed to the promise constructor **never** rejects.

---

```ts
// type: Effect<never, unknown, Response>
const response = Effect.tryPromise({
  try: () => fetch("..."),
  catch: (_caughtError) => new Error("fetch rejected"),
});
```

notes:
If it might, just like the synchronous version try, we can use tryPromise to handle rejected promises with a catch function

---

Running Effects
```ts
// type: Effect<never, never, number>
const program = Effect.sync(() => {
  console.log("Hello, World!")
  return 1
});
// Console: <blank>
```

notes:
Well this is great we have a bunch of Effects, but we have to run them for them to do anything. To do this we can use the two basic run functions provided by Effect.

---

Running synchronous Effects
```ts
// type: Effect<never, never, number>
const program = Effect.sync(() => {
  console.log("Hello, World!")
  return 1
});
// Console: <blank>
 
// type: number
const result = Effect.runSync(program);
// Console: Hello, World!
 
console.log(result);
// Console: 1
```

notes:
To run an Effect synchronously we can use the `runSync` function. This will run our effect, triggering any side effects and returning the a value of the value type of the ran effect.

If the effect fails, or if any asynchronous tasks are performed the `runSync` function will throw an Error.

---

Running asynchronous Effects
```ts
// type: Effect<never, never, number>
const program = Effect.promise(() => 
  Promise.resolve(42)
);

// type: Promise<number>
const result = Effect.runPromise(program);
 
result.then(console.log);
// Console: 1
```

notes:
To run effects with asynchronous computations we can use runPromise, which will return a promise of the value type of the ran Effect. Just like runSync, if the ran effect fails, the returns promise will reject.

---

Effects are composable...
So compose them
```ts
Effect.succeed(Effect.runSync(myEffect))
// Please don't do this
```

notes:
Running Effects should occur at the edges of your program, when you have no other choice but to run an Effect. 

While you're within Effect code, Effect provides tools for you to manipulate the values inside an Effect without needing to run it.

---

Chaining transformations with pipe

```ts
const result = pipe(input, func1, func2, ..., funcN)
``` 

![[pipe-mermaid.png]]

notes:
before we discuss the specifics of these transformation functions, its important to stop and explain pipe. Pipe is what allows us to seamlessly carry out one transformation function after another. It takes a value and a series of functions and applies them one at a time.

This is best shown with an example

---

```ts
const increment = (x: number) => x + 1
const double = (x: number) => x * 2
const subtractTen = (x: number) => x - 10
 
const result = pipe(5, increment, double, subtractTen)
// identical to subtractTen(double(increment(5)))
 
console.log(result) // Output: 2
```

notes:
Here we have 3 functions which each take and return a number. Using pipe we apply them one at a time, feeding the output of one as the input to the next and ending up with our final result. 

Pipe allows us to use functions in a clear left to right or top to down order instead of confusing deeply nested function calls.

---

The pipe method:

```ts
pipe(effect, func1, func2, ...)
```

```ts
effect.pipe(func1, func2, ...)
```

These are identical

notes:

For convenience the Effect type also has a pipe method which is identical to passing the effect as the first argument to the pipe function, but can look a bit cleaner. I'll mainly use the pipe function through the examples in this video, just know both the pipe function and the pipe method are the same and you can use whichever way works best for you.

---

Transforming the value of an effect with map
```ts
// type: Effect<never, never, string>
const mappedEffect = pipe(
  Effect.succeed(1),
  // "x" type: number
  Effect.map((x) => String(x))
)
 
console.log(Effect.runSync(mappedEffect)) // Output: "1"
```

notes:
the map function is simple, it applies the function passed to it to the value inside an effect, and returns a new effect with whose value as the output of that function.

In this example the function passed to map takes in a number, in this case the 1 value from the previous effect, and converts it to a string. When we log the result after running the effect and see the output is a string 1

---
```ts
const mappedEffect = pipe(
  Effect.succeed({ x: 5, y: 0 }),
  Effect.map(({x, y}: { x: number, y: number }) =>
	y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
  )
)
```

notes:
Lets recreate our divide function from earlier, but this time with the input as a single object so it can be the singular value of an effect. Just like earlier, our mapping function will either error with an Error or succeed with a number.

---

This isn't right

```ts
const mappedEffect = pipe(
  Effect.succeed({ x: 5, y: 0 }),
  Effect.map(({x, y}: { x: number, y: number }) =>
	y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
  )
)
```

```ts
typeof mappedEffect = Effect<
	never, 
	never, 
	Effect<never, Error, number>
>;
```

notes:
Well this sure isn't what we wanted. Our Effect has a value of another Effect. 

---
We want to the Effects to merge
```ts
type WhatWeWant = Effect<never, Error, number>;
```
notes:
What we really want it for the effects to merge, carrying the new value type from the output of the mapping function, while combining the possible Errors

---

Effectful transformations with flatMap

```ts
// type: Effect<never, Error, number>
const flatMappedEffect = pipe(
  Effect.succeed({ x: 5, y: 0 }),
  Effect.flatMap(({x, y}: { x: number, y: number }) =>
	y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
  )
)
```

notes:
To do this we can use flatMap. flatMap takes a function that accepts an input whose type is the value of the previous Effect and returns a new Effect. The result of the flat map will be a new Effect whose value is the value of the returned Effect, and whos error and requirements are a combination of the old and new Effects.

---

```ts
// type: Effect<never, never, number>
const getRandomNumber = Effect.sync(() => Math.random() * 10);

// returns: Effect<never, Error, number>
const checkIfAtLeastFive = (x: number) =>
  x > 5 ? 
    Effect.succeed(x) : 
    Effect.fail(new Error("number is less than 5"));

// returns: Effect<never, never, void>
const logNumber = (x: number) => Effect.log(x.toString());
```

notes:
Lets take a look at a short example using what we've learned so far. To start we'll define three values.

The first, getRandomNumber returns a effect that always succeeds with a random number between 1-10. We use Effect.sync and not Effect.succeed because the generation of a random number is a side effect.

next, checkIfAtLeastFive is a function that returns an Effect that fails with type Error if the number is less than 5, or succeeds with the passed number if its greater than 5.

Finally, logNumber uses Effect.log to create an effect that represents the logging of the value to the console. We'll talk more about logging later in the video.

---
```ts [2-3]
const program = pipe(
  getRandomNumber,
  // Effect<never, never, number>
)
```
notes:
our program will start will the getRandomNumber Effect. It may feel strange to see the generation of a random number as a value not a function, you would think using a value would just represent a single generated number

---
Normal Typescript
```ts
const getRandomNumber = Math.random() * 10;
getRandomNumber // 6.687255774479639
getRandomNumber // 6.687255774479639
getRandomNumber // 6.687255774479639
```

Effect
```ts
// type: Effect<never, never, number>
const getRandomNumber = Effect.sync(() => Math.random() * 10);

Effect.runSync(getRandomNumber) // 5.302813847147179
Effect.runSync(getRandomNumber) // 6.935519254857123
Effect.runSync(getRandomNumber) // 3.2272729578006554
```

notes:
But remember this value is an Effect which represents the computation of this random number, which is lazily evaluated. This means the same effect value can be used in multiple places, as it triggers the internal side effect each time it is run.

---
```ts [4-5]
const program = pipe(
  getRandomNumber,
  // Effect<never, never, number>
  Effect.map((x) => x * 2),
  // Effect<never, never, number>
)
```
notes:
next, we'll apply a map function that multiplies the number by 2.

---
```ts [6-7]
const program = pipe(
  getRandomNumber,
  // Effect<never, never, number>
  Effect.map((x) => x * 2),
  // Effect<never, never, number>
  Effect.flatMap((x) => checkIfAtLeastFive(x)),
  // Effect<never, Error, number>
)
```
notes:
Then we'll flatMap with the check if at least 5 function. Notice that the type of our program now contains the error from that function.

---
```ts [8-9]
const program = pipe(
  getRandomNumber,
  // Effect<never, never, number>
  Effect.map((x) => x * 2),
  // Effect<never, never, number>
  Effect.flatMap((x) => checkIfAtLeastFive(x)),
  // Effect<never, Error, number>
  Effect.flatMap((x) => logNumber(x))
  // Effect<never, Error, void>
);
```

notes:
finally we'll flat map with our log function. The final program is of type Effect never Error void, meaning it either fails with type Error or succeeds with type void.

---

the value was consumed by logNumber

```ts
pipe(
	Effect.succeed(5),
	Effect.flatMap((x) => logNumber(x)),
	Effect.map((x) => x + 1)
	// ^ ERROR: 
	// '+' cannot be applied to types 'void' and 'number'.
)
```

notes:
What if we want to cause some side effect, but still have access to the original value after?

---

Execute side effects with tap
```ts
const program = pipe(
	Effect.succeed(5),
	Effect.tap((x) => logNumber(x)),
	// x is still available!
	Effect.map((x) => x + 1)
)

Effect.runSync(program); // 6
// console: 5
```

notes:
We can do this with the tap function. Tap is just like flatMap but the result of the function passed to is it ignored, and the original value is still available for the next function. This is useful for executing side effects without altering the result of an Effect

---

Consuming multiple Effects with all

```ts
const foo = Effect.succeed(42)
const bar = Effect.succeed("Hello")
 
// type: Effect<never, never, [number, string]>
const combinedEffect = Effect.all([foo, bar])
 
console.log(Effect.runSync(combinedEffect))
// console: [42, "Hello"]
```

notes:
So far we've only been working with single values, but what about transforming the results of multiple Effects.

For this we can use all. All takes an array of effects and returns an Effect whose value is a tuple of the values of the passed effects.

Here in this example, we merge foo and bar to a single effect then run and log it.

---

A real program!

notes:
And thats all we need to get started on the example program we will make and improve over the rest of the video.

---

Find the heaviest pokemon!
![[143-Snorlax.webp|200]]
notes:
Our program will look like this:
Generate some random numbers
using the numbers as ids, get information about the pokemon with that id from an api
validate the returned json
find the heaviest pokemon and log it

It will simple but naïve and we'll add robustness bit by bit.

---
```ts
// type: Effect<never, Error, any>
const getPokemon = (id: number) =>
  Effect.tryPromise({
	    try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
				.then((res) => res.json()),
		catch: (e) => new Error("error fetching pokemon: ${e.message}")
    }),
```

notes:
We'll start with a function to get the pokemon data from the api. We're using tryPromise to wrap the fetch call because it might reject.
However the value of the resulting Effect is any, we should validate what type it is.

---

@effect/schema
```ts
import * as Schema from "@effect/schema/Schema";

const pokemonSchema = Schema.struct({
  name: Schema.string,
  weight: Schema.number,
});

type Pokemon = Schema.To<typeof pokemonSchema>;
const parsePokemon = Schema.parseEither(pokemonSchema);
```
notes:

Effect has a first part validation library called schema, which we will use to validate the shape of the data returned from the api. We define our schema as an object with a string name, and a number weight, then derive a type and validation function from this schema.

This video won't cover schema outside of this one use case, just know it exists, can be used for validation and works seamlessly within the Effect ecosystem.

Be sure to check out the schema github readme for more information and look out for a video covering it from me in the future.

---
validation!
```ts
// returns: Effect<never, Error | ParseError, Pokemon>
const getPokemon = (id: number) =>
  pipe(
    Effect.tryPromise({
	    try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
				.then((res) => res.json()),
		catch: (e) => new Error("error fetching pokemon: ${e.message}")
    }),
    Effect.flatMap((x) => parsePokemon(x))
  );
```

notes:
We can pass the result of the fetch + json Effect to the parsePokemon function combined with flat map to validate it. Now we can see the returned effect contains a Pokemon, as well as a potential parsing error being added to the error channel

---

```ts
// type: Effect<never, never, number>[]
const getRandomNumberArray = 
	Array.from({ length: 10 }, () =>
	    Effect.sync(() => Math.floor(Math.random() * 100) + 1)
	)
```

notes:
next, our random array function, it will generate a array of 10 random numbers between 1 and 101. First we fill the array with an effect to generate a number.

---
```ts
// type: Effect<never, never, number>[]
const getRandomNumberArray = 
	Array.from({ length: 10 }, () =>
	    Effect.sync(() => Math.floor(Math.random() * 100) + 1)
	)
	
// type: Effect<never, never, number[]>
const getRandomNumberArray = Effect.all(
	Array.from({ length: 10 }, () =>
	    Effect.sync(() => Math.floor(Math.random() * 100) + 1)
	)
)
```

notes:
Then we use Effect.all to convert the array of effects to a single effect with an array of numbers

---

```ts
// type: Effect<never, Error, Pokemon[]>
const program = pipe(
	getRandomNumberArray,
	Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
)
```

notes:
Now we can start our program as a pipeline beginning with the random number array effect. Then we take that array and map it with our get pokemon function, this returns an array of effects so we once again use Effect.all to end up with a single effect containing an array of pokemon

---

```ts
// type: Effect<never, Error, Pokemon[]>
const program = pipe(
	getRandomNumberArray,
	Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
)

Effect.runPromise(program).then(console.log)
```

notes:
Then using runPromise we can run the program to trigger all the Effects and return the pokemon array to log to the console

---

```json
[
  { name: 'nidorino', weight: 195 },
  { name: 'zubat', weight: 75 },
  { name: 'mankey', weight: 280 },
  { name: 'ekans', weight: 69 },
  { name: 'magnemite', weight: 60 },
  { name: 'dodrio', weight: 852 },
  { name: 'dodrio', weight: 852 },
  { name: 'nidorina', weight: 200 },
  { name: 'tentacruel', weight: 550 },
  { name: 'charmander', weight: 85 }
]
```

notes:
After running our code, assuming none of the fetch or validation operations failed we will see all of the data printed out

---

```ts
const formatPokemon = (pokemon: Pokemon) =>
  `${pokemon.name} weighs ${pokemon.weight} hectograms`;

const program = pipe(
  getRandomNumberArray,
  Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
  Effect.tap((pokemons) =>
    Effect.log("\n" + pokemons.map(formatPokemon).join("\n"))
  ),
);
```

notes:
Then to clean things up a bit we'll add a simple format pokemon function to map our pokemon array with, and use Effect.log combined with Effect.tap to trigger this side effect.

---

```ts
// return type: Effect<never, Error, number>
const calculateHeaviestPokemon = (pokemons: Pokemon[]) =>
  Effect.reduce(pokemons, 0, (highest, pokemon) =>
    pokemon.weight === highest
      ? Effect.fail(new Error("two pokemon have the same weight!"))
      : Effect.succeed(pokemon.weight > highest ? pokemon.weight : highest)
  );
```

notes:
To calculate the heaviest pokemon well create a new function takes an array of pokemon and uses Effect.reduce, which is like the normal array.reduce but where the reducing function returns an effect allowing for error handling

In this case if two pokemon have the same weight we will consider that an error and return a effect failure containing an error.

---

```ts [6-9]
const program = pipe(
  getRandomNumberArray,
  // Effect<never, Error, number[]>
  Effect.flatMap((arr) => Effect.all(arr.map(getPokemon))),
  // Effect<never, Error, Pokemon[]>
  Effect.tap((pokemons) =>
    Effect.log("\n" + pokemons.map(formatPokemon).join("\n"))
  ),
  // Effect<never, Error, Pokemon[]>
  Effect.flatMap((pokemons) => calculateHeaviestPokemon(pokemons)),
  // Effect<never, Error, number>
  Effect.flatMap((heaviest) =>
    Effect.log(`The heaviest pokemon weighs ${heaviest} hectograms!`)
  )
  // Effect<never, Error, void>
);
```

notes:
Then we can add this to the end of our program, flat mapping with our calculate heaviest pokemon function and logging out the result, this time with flatMap instead of tap as its fine to consume the number as this is the final part of our program.

The type of our entire program is Effect never unknown void meaning it takes no requirements, may error with some Error object, and returns no value on success.

---
```
timestamp=2023-... level=INFO fiber=#0 message="
hypno weighs 756 hectograms
raichu weighs 300 hectograms
krabby weighs 65 hectograms
charmander weighs 85 hectograms
farfetchd weighs 150 hectograms
slowpoke weighs 360 hectograms
tentacruel weighs 550 hectograms
golbat weighs 550 hectograms
paras weighs 54 hectograms
zubat weighs 75 hectograms"
timestamp=2023-... level=INFO fiber=#0 message="The heaviest pokemon weighs 756 hectograms!"
```

notes:
and running it does what we expect

---

## Generators
like async await but for effect

notes:
Now were going to talk about Effect generators, a optional way to write your effects in a more familiar way. Just like async await allows us to write asynchronous code in a synchronous looking way, generators allow us to write effectful code in the same familiar manner.

---

```ts
declare const imAnEffect: Effect<never, Error, number>;

// type: Effect<never, Error, string>
const program = Effect.gen(function* (_) {
	// type: number
	const valueOfEffect = yield* _(imAnEffect);
	return String(valueOfEffect);
})
```

notes:
Using generators looks like this. First pass a generator (the function*) to the Effect.gen function. This generator takes one argument called an adapter, which the common convention is to alias with an underscore. 

Whenever we want to extract the value of an effect for use in our funciton, all you need to use is `yield* adapter`. This evaluates to the value within the effect, while automatically propagate any errors or requirements from that effect to the effect returned by effect.gen

other than that just write your logic just as you normal would and return the result.

---

```ts
const program = pipe(
  getRandomNumber,
  // Effect<never, never, number>
  Effect.map((x) => x * 2),
  // Effect<never, never, number>
  Effect.flatMap((x) => checkIfAtLeastFive(x)),
  // Effect<never, Error, number>
  Effect.flatMap((x) => logNumber(x))
  // Effect<never, Error, void>
);
```

notes:
remember this example from earlier?
lets convert it from using pipe to using generators

---

```ts
// type: Effect<never, Error, void>
const after = Effect.gen(function* (_) {
	const x = yield* _(getRandomNumber);
	const y = x * 2;
	const z = yield* _(checkIfAtLeastFive(y));
	yield* _(logNumber(z));
});
```

notes:
Now we can assign values to variables and manipulate them just like normal. Previously where we used Effect.flatMap now we use the yield* adapter pattern, and Effect.map just become regular code.

---

Generators are optional

notes:
generators are just another way to write your effects. you can use them nowhere, everywhere, or in between, whatever style works best for you.

now lets see what it would look like to use generators in our pokemon program where we previously used pipe

---

```ts
// type: Effect<never, unknown, Pokemon>
const getPokemon = (id: number) =>
  Effect.gen(function* (_) {
    const res = yield* _(
      Effect.tryPromise({
        try: () =>
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
            res.json()
          ),
        catch: () => new Error("error fetching pokemon"),
      })
    );
    return yield* _(parsePokemon(res));
  });
```

notes:
our new get pokemon function looks like this. We yield the value from our fetch trypromise Effect and assign it to a variable, then we pass that to the parsePokemon function and yield then return the result.

---

```ts
// type: Effect<never, unknown, void>
const program = Effect.gen(function* (_) {
  const arr = yield* _(getRandomNumberArray);
  const pokemons = yield* _(Effect.all(arr.map(getPokemon)));
  yield* _(Effect.log("\n" + pokemons.map(formatPokemon).join("\n")));
  
  const heaviest = yield* _(calculateHeaviestPokemon(pokemons));
  yield* _(Effect.log(`The heaviest pokemon weighs ${heaviest} hectograms!`));
});
```

notes:
In our main program, we yield each effect assigning the result to a variable if there is one.

---

## Error Handling

notes:
Errors happen, but if we can account for them our code becomes much safer. If you've watched my previous Effect videos you know try-catch is a massively flawed error handling strategy.

---

```ts
type Effect<Requirements, Error, Value> = (
  requirements: Requirements
) => Error | Value;
```

notes:
Effect's on the other hand treat errors as first class citizens, allowing them to be fully typesafe values that could be the result of an Effect.

---
```ts
Effect.fail(new Error("two pokemon have the same weight!"))
```

notes:
Up to now we've been using native Error objects with messages as our errors, but Effect's error handling becomes really powerful when you define your own error types.

---
```ts
type DivideByZeroError = {
	readonly _tag: "DivideByZeroError"
}

type HttpError = {
	readonly _tag: "HttpError",
	readonly statusCode: number;
}
```


notes:
In normal javascript the convention is to extend the Error class, but this is not required in Effect, just a plain object type that defines the contents of the error.

To prevent typescript from unifying types during inference and to identify types at runtime, Effect commonly uses a `_tag` field with a unique string name for that type.

---

```ts
class DivideByZeroError {
	readonly _tag = "DivideByZeroError"
}

class HttpError {
	readonly _tag = "HttpError"
	constructor(readonly statusCode: number) {}
}

Effect.fail(new DivideByZeroError());
Effect.fail(new HttpError(404));
```

notes:
Using classes is a really convenient way to define a type and a constructor function for that type at the same. This is also a very common pattern in Effect.

---
### Catching Errors

```ts
declare const mayError: Effect.Effect<
  never,
  DivideByZeroError | HttpError,
  string
>;
```

notes:
So we have effects with errors, but what tools are available to deal with those situations?

---

### Catching all errors

```ts
// type: Effect<never, never, string>
const caughtAll = mayError.pipe(
  // "e" type: DivideByZeroError | HttpError
  Effect.catchAll((error) =>
    Effect.succeed(`Recovering from any Error (${error._tag})`)
  )
);
```

notes:
To handle every possible error we can use the catchAll function. This takes a handler function which takes the error as an argument and returns an effect to become the new value in the case of any error being present.

After using catchAll on our example effect, the new error type is never

---

### Catching specific errors

```ts
// type: Effect<never, DivideByZeroError, string>
const caughtTag = mayError.pipe(
  // "e" type: HttpError
  Effect.catchTag("HttpError", (httpError) =>
    Effect.succeed(
      `recovering from httpError with status: ${httpError.statusCode}`
    )
  )
);
```

notes:
To catch a specific type of error we can use Catch tag, whose first argument is the string tag of the error to catch

All other errors will still remain in the error channel, such as the DivideByZeroError in this example.

---

### Catching multiple specific errors

```ts
// type: Effect<never, never, string>
const caughtTags = mayError.pipe(
  Effect.catchTags({
    HttpError: (httpError) =>
      Effect.succeed(
        `recovering from httpError with status: ${httpError.statusCode}`
      ),
    DivideByZeroError: () =>
      Effect.succeed("recovering from divideByZeroError"),
  })
);
```

notes:
As an alternative to using catch tag multiple times, the catch tags function allows you pass an object where each key represents a tag, with its value being the function to handle that error case. 

---

### Short Circuiting

```ts
const operation1 = Effect.sync(() => console.log("operation1"))
const operation2 = Effect.fail(new Error("Something went wrong!"))
const operation3 = Effect.sync(() => console.log("operation3"))

Effect.runSync(
  operation1.pipe(
    Effect.flatMap(() => operation2),
    Effect.flatMap(() => operation3) // This computation won't be executed because the previous one fails
  )
)
/* console:
operation1
<UNCAUGHT ERROR>...
*/
```

notes:
In Effect errors short circuit. This means execution of the the 'happy' error-free path ceases immediately, when a error is encountered.

This example demonstrates this behavior, since operation 2 fails the console log of operation 3 never gets executed.

---

## Pokemon Error Handling!

notes:
Now lets modify our pokemon program to handle errors where we previously ignored them

---

```ts
// returns: Effect<never, unknown, Pokemon>
const getPokemon = (id: number) =>
  pipe(
    Effect.tryPromise({
      try: () =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) =>
          res.json()
        ),
      catch: () => new Error("error fetching pokemon"),
    }),
    Effect.flatMap(parsePokemon)
  );
```

notes:
We'll start by modifying our getPokemon function. It has two possible errors, the response promise rejected and the json promise rejecting. Previously we caught both under the same generic error object, however now lets make them distinct.

---

```ts
class FetchError {
  readonly _tag = "FetchError";
}

class JSONError {
  readonly _tag = "JSONError";
}
```

notes:
To start we'll define our new errors as classes. These don't need to contain any additional information, their identifier alone is enough.

---

```ts [4-7, 9-14]
// type: Effect<never, FetchError | JSONError | ParseError, Pokemon>
const getPokemon = (id: number) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      catch: () => new FetchError(),
    }),
    // Effect<never, FetchError, Response>
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.json(),
        catch: () => new JSONError(),
      })
    ),
    // Effect<never, FetchError | JSONError, any>
    Effect.flatMap((x) => parsePokemon(x))
    // Effect<never, FetchError | JSONError | ParseError, Pokemon>
  );
```

notes:
Now we can separate the fetch call and the json call into two separate tryPromise effects, which each fail with their respective error type.

Now we can see the resulting effect contains all three possible errors that could occur.

---
```ts [1-4, 10]
class SameWeightError {
  readonly _tag = "SameWeightError";
  constructor(readonly weight: number) {}
}

// type: Effect<never, SameWeightError, number>
const calculateHeaviestPokemon = (pokemons: Pokemon[]) =>
  Effect.reduce(pokemons, 0, (highest, pokemon) =>
    pokemon.weight === highest
      ? Effect.fail(new SameWeightError(pokemon.weight))
      : Effect.succeed(pokemon.weight > highest ? pokemon.weight : highest)
  );
```

notes:
Next we'll create a same weight error for the calculateHeaviestPokemon function. It will contain the weight that the two pokemon share

---
```ts [1]
// Effect<never, ParseError | FetchError | JSONError | SameWeightError, void>
const program = pipe(
  Effect.all(getRandomNumberArray(10).map(getPokemon)),
  Effect.tap((pokemons) =>
    Effect.sync(() => console.log(pokemons.map(formatPokemon).join("\n"), "\n"))
  ),
  Effect.flatMap(calculateHeaviestPokemon),
  Effect.map((heaviest) =>
    console.log(`The heaviest pokemon weighs ${heaviest} hectograms!`)
  )
);
```


notes:
We can see these all the errors have made it all the way to our final program effect. We want this final program to never fail so lets add logic to handle these errors.

---

```ts [1, 8-10]
// Effect<never, ParseError | FetchError | JSONError, void>
const program = pipe(
  Effect.all(getRandomNumberArray(10).map(getPokemon)),
  Effect.tap((pokemons) =>
    Effect.sync(() => console.log(pokemons.map(formatPokemon).join("\n"), "\n"))
  ),
  Effect.flatMap(calculateHeaviestPokemon),
  Effect.catchTag("SameWeightError", (e) =>
    Effect.log(`Two pokemon have the same weight: ${e.weight}`)
  ),
  Effect.map((heaviest) =>
    console.log(`The heaviest pokemon weighs ${heaviest} hectograms!`)
  )
);
```

notes:
to start, we can catch the same weight error and log out a message

however, the errors from the getPokemon function are still there

---

```ts [15]
// Effect<never, never, Pokemon>
const getPokemon = (id: number) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      catch: () => new FetchError(),
    }),
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.json(),
        catch: () => new JSONError(),
      })
    ),
    Effect.flatMap(parsePokemon),
    Effect.catchAll(() => Effect.succeed({ name: "default", weight: 0 }))
  );
```

notes:
At the end of our pipeline in getPokemon we can use catchAll to handle every error case and return a default implementation of our pokemon type

now the error type of the returned effect is never

---

```ts
// Effect<never, never, void>
const program = pipe(
	// ...
);
```

notes:
after this our entire program has an error channel of never, meaning we can be sure it will never error

---

### Error Handling in Generators

```ts [17-19]
// Effect<never, never, Pokemon>
const getPokemon = (id: number) =>
  Effect.gen(function* (_) {
    const response = yield* _(
      Effect.tryPromise({
        try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        catch: () => new FetchError(),
      })
    );
    const json = yield* _(
      Effect.tryPromise({
        try: () => response.json(),
        catch: () => new JSONError(),
      })
    );
    return yield* _(parsePokemon(json));
  }).pipe(
    Effect.catchAll(() => Effect.succeed({ name: "default", weight: 0 }))
  );
```

notes:
In generators, code represents the happy path, so we can add error handling at the end of the generator. Here's what our the gen version of our new getPokemon function looks like. We create variable for response and json, yielding effects like before. At the end we use the pipe method to pass our catchAll functionality.

---

```ts [9-14]
// type: Effect<never, never, void>
const program = Effect.gen(function* (_) {
  const arr = yield* _(getRandomNumberArray);
  const pokemons = yield* _(Effect.all(arr.map(getPokemon)));
  yield* _(Effect.log("\n" + pokemons.map(formatPokemon).join("\n")));
  const heaviest = yield* _(calculateHeaviestPokemon(pokemons));
  yield* _(Effect.log(`The heaviest pokemon weighs ${heaviest} hectograms!`));
}).pipe(
  Effect.catchTag("SameWeightError", (e) =>
    Effect.log(`Two pokemon have the same weight: ${e.weight}`)
  )
);
```

notes:
We can do a similar thing for our program effect, adding our catchTag functionality in the pipe method after the generator.

---

```ts [6-17]
const program = Effect.gen(function* (_) {
  const arr = yield* _(getRandomNumberArray);
  const pokemons = yield* _(Effect.all(arr.map(getPokemon)));
  yield* _(Effect.log("\n" + pokemons.map(formatPokemon).join("\n")));

  const heaviestResult = yield* _(
    Effect.either(calculateHeaviestPokemon(pokemons))
  );

  yield* _(
    Effect.match(heaviestResult, {
      onSuccess: (heaviest) =>
        Effect.log(`The heaviest pokemon weighs ${heaviest} hectograms!`),
      onFailure: (e) =>
        Effect.log(`Two pokemon have the same weight: ${e.weight}`),
    })
  );
});
```

notes:
One other option here would be to use Effect.either to get make the value yielded either the value or error, then use Effect.match to handle both cases.

---

```ts
Effect.tryPromise({
      try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
      catch: () => new FetchError(),
    }),
```

notes:
Currently our pokemon app is hard coded to fetch data through a fetch call to a specific api, but what if we wanted to get the data from a different api, or a database, or maybe even add a cache layer within our application to check before making an api call. To do this traditionally you would have to refactor your code on every change, 

```ts
const getPokemon = (id: number, client: PokemonClient) =>
  pipe(
    client.pokemon.getById(id),
    // ...
  )
```

but what if we could abstract the signature of the data fetching to a dependency that we pass to our effects and could change the implementation of somewhere higher up the chain

---

### Adding Requirements
(dependency injection)

notes:
Effect provides this behavior through the Requirements field of the Effect type which we have ignored up until now. Lets look at a simple example

---
```ts
interface Random {
  readonly _tag: "Random"
  readonly next: Effect.Effect<never, never, number>
}
```

notes:
first we'll define the type signature of our dependency. Here it will be an object with a unique tag and one other property, next, that is a Effect never never number. Like earlier, next is noticeably not a method, because effects are lazily evaluated, every time next is run a new number will be yielded.

---
```ts
import { Effect, Context } from "effect"

interface Random {
  readonly _tag: "Random"
  readonly next: Effect.Effect<never, never, number>
}

const Random = Context.Tag<Random>()
```

notes:
Then we'll import the context module from effect and use the tag function passing the type we just created as a generic. A tag is a unique identifier that represents a dependency of the type passed as the generic. 

---
```ts
// type: Effect<Random, never, void>
const program = pipe(
  Random,
  // "random" type: Random
  Effect.flatMap((random) => random.next),
  Effect.flatMap((randomNumber) => Effect.log(`random number: ${randomNumber}`))
)
```

notes:
We can use the tag just like any other effect, here piping it through flatMap. Within the flatmap function we get access to the value of type Random where we can use the next attribute. Notice how the Random type now appears in the requirements field of the resulting Effect.

---

```ts
// type: Effect<Random, never, void>
const program = pipe(
  Random,
  // ...
)

Effect.runSync(program) // ERROR! Type 'Random' is not assignable to type 'never'
```

notes:
If we try to run a program with a requirements field that is not type 'never' we get a type error. Effect is ensuring we provide any dependencies required for our program before it can be run.

---
```ts
// type: Effect<never, never, number>
const runnable = program.pipe(
  Effect.provideService(
    Random,
    Random.of({ _tag: "Random", next: Effect.sync(() => Math.random()) })
  )
);

Effect.runSync(runnable);
// console: random number: 0.8132812328994277
```
notes:
We can do this with the provide service function. It takes the tag, and a value that fulfils the type of the tag. After we provide the service notice how the requirements field has gone back to never, meaning this Effect can now be run.

 lets apply this concept to our pokemon program

---
```ts
type PokemonClient = {
  _tag: "PokemonClient";
  getById(
    id: number
  ): Effect.Effect<never, FetchError | JSONError | ParseError, Pokemon>;
};
const PokemonClient = Context.Tag<PokemonClient>();
```

notes:
Well start by defining the type signature of our client and its tag. For now it will just have 1 method 'getById' which will take a number and return an Effect containing either a Pokemon or the possible errors from before.

---

```ts
// return type: Effect<PokemonClient, never, Pokemon>
const getPokemon = (id: number) =>
  pipe(
    PokemonClient,
    Effect.flatMap((client) => client.getById(id)),
    Effect.catchAll(() => Effect.succeed({ name: "default", weight: 0 }))
  );
```

notes:
Our getPokemon function now looks much simpler as the data fetching logic has been abstracted away. We use the client tag and call the getById method, then catch any errors with our default pokemon. The pokemon client type now appears in the requirements field.

---
```ts
program.pipe(
  Effect.provideService(PokemonClient, {
    getById: (id) =>
      pipe(
        Effect.tryPromise({
          try: () => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
          catch: () => new FetchError(),
        }),
        Effect.flatMap((response) =>
          Effect.tryPromise({
            try: () => response.json(),
            catch: () => new JSONError(),
          })
        ),
        Effect.flatMap(parsePokemon)
      ),
  }),
  Effect.runPromise
);
```

notes:
now we can provide the pokemon client implementation before passing the result to runPromise. Here our implementation of the getById method is identical to the logic of our getPokemon function previously, but now we could change the data source or adding caching, and our downstream usage of the client doesn't need to change at all.

---

```ts
const getPokemon = (id: number) =>
  Effect.gen(function* (_) {
    const client = yield* _(PokemonClient);
    return yield* _(client.getById(id));
  }).pipe(
    Effect.catchAll(() => Effect.succeed({ name: "default", weight: 0 }))
  );
```

notes:
With generators we get the client by yielding the tag and return the yielded result of getById, then provide the service the same as we did just now in the pipe version.

---

## Logging

notes:
Our final topic will be logging. Effect provides a powerful set of logging tools to use to observe your program.

---

```ts
// type: Effect<never, never, void>
const program = Effect.log("Application started")
 
Effect.runSync(program)
/*
Output:
timestamp=2023-07-05T09:14:53.275Z level=INFO fiber=#0 message="Application started"
*/
```

notes:
As briefly introduced earlier, the log function logs the given message to the console along with some additional information and returns a void effect

---

```ts
const logLevels = pipe(
  Effect.log("info by default"),
  Effect.flatMap(() => Effect.logDebug("debug")),
  Effect.flatMap(() => Effect.logInfo("info")),
  Effect.flatMap(() => Effect.logWarning("warning")),
  Effect.flatMap(() => Effect.logError("error")),
  Effect.flatMap(() => Effect.logFatal("fatal"))
);

Effect.runSync(logLevels);
```
```
timestamp=2023-07-25T04:30:54.447Z level=INFO fiber=#1 message="info by default"
timestamp=2023-07-25T04:30:54.447Z level=INFO fiber=#1 message=info
timestamp=2023-07-25T04:30:54.447Z level=WARN fiber=#1 message=warning
timestamp=2023-07-25T04:30:54.448Z level=ERROR fiber=#1 message=error
timestamp=2023-07-25T04:30:54.448Z level=FATAL fiber=#1 message=fatal
```

notes:
Effect has different log levels that can be used to categorize your logs. You may notice that the logDebug call was not printed to the console, and this is intentional. By default all debug logs are not printed.

---

```ts
import { Effect, Logger, LoggerLevel, pipe } from "effect";

const logDebug = pipe(
  Effect.logDebug("debug"),
  Logger.withMinimumLogLevel(LoggerLevel.Debug)
);

Effect.runSync(logDebug);
```
```
timestamp=2023-07-25T04:33:07.743Z level=DEBUG fiber=#2 message=debug
```

notes:
Using the withMinimumLogLevel function from the Logger module we can manually adjust this setting. In this case we can lower it to now show debug logs, but if you can choose to set a higher minimum level as well.

---

### Timing Things!

notes:
Our final topic will be on timing spans of your program

---

```ts
// type: Effect<never, never, void>
const program = pipe(
  Effect.sleep("1 seconds"),
  Effect.flatMap(() => Effect.log("The job is finished!")),
  Effect.withLogSpan("myspan")
)
 
Effect.runPromise(program)
/*
timestamp=... level=INFO fiber=#0 message="The job is finished!" myspan=1011ms
*/
```

notes:
Using the withLogSpan function our logs will now include a timing of that span

lets add logging and benchmark the timing of our pokemon program

---

```ts
const program = pipe(
  Effect.all(getRandomNumberArray(10).map(getPokemon)),
  Effect.tap((pokemons) =>
    Effect.sync(() => console.log(pokemons.map(formatPokemon).join("\n"), "\n"))
  ),
  Effect.flatMap(calculateHeaviestPokemon),
  Effect.catchTag("SameWeightError", (e) =>
    Effect.logError(`Two pokemon have the same weight: ${e.weight}`)
  ),
  Effect.flatMap((heaviest) =>
    Effect.log(`The heaviest pokemon weighs ${heaviest} hectograms!`)
  ),
  Effect.tap(() => Effect.log("program finished")),
  Effect.withLogSpan("program")
);
```

notes:
First we'll convert our previous vanilla log when catching the same weight error to an error log, then we'll add a program finished log after the program has completed along with its own log span

---

```
...

timestamp=2023-07-27T03:51:48.296Z level=INFO fiber=#0 message="program finished" program=454ms
```

notes:
after running, it looks like the program took around 450ms to complete.

---
```ts
Effect.all(arr.map(getPokemon))
```

notes:
by default effect.all runs effects in sequence one at a time, in our case only making the next pokemon fetch request wait until the one before it has fully completed.

We can speed this up by running the effects concurrently all at the same time

---

```ts
Effect.all(arr.map(getPokemon), {
    concurrency: "unbounded",
})
```

notes:
In effect this is as easy as adding concurrency unbounded as a additional argument to Effect.all. This argument can also take a number if you want to set a specific concurrency limit.

---
```
timestamp=2023-07-27T03:52:53.068Z level=INFO fiber=#0 message="program finished" program=208ms
```

notes:
Running it again and with just that one change we've cut the time in half, pretty cool. Program complete!

---

### Effects
- the description of a program
- may have some requirements
- yields a value or an error when run

notes:
Lets recap.

Effects are immutable values describing some operators to be executed when the effect is run. Any side effects present in the effect are only triggered when the effect is run. An Effect may require some dependencies before it can be run, and when run may produce either a value or an error

---

### Creating Effects
- From a value: `succeed` and `fail`
- From a function (or something that triggers side effects)
	- Synchronous: `sync` and `try` for catching errors
	- Asynchronous: `promise` and `tryPromise` for handling rejections

notes:
To create Effects from values we use the succeed and fail constructors. To create effects from a function, or any operation that triggers a side effect we use sync, or promise for asynchronous effects. If these operations have any chance of failing we must try or tryPromise to absorb those errors into the resulting Effect

---

### Running Effects
(for `Effect<R, E, A>`)
- Synchronous: `runSync`
	- returns `A` or throws `E`
	- throws if anything async 
- Asynchronous: `runPromise`
	- returns `Promise<A>` that may reject with `E`
notes:
Effects should only be run at the edges of our program when required to finally yield a value. For purely synchronous effects we use `runSync`, and if even a single effect contains asynchronous code we must use `runPromise`

---
### Pipelines
- Apply successive transformations with `pipe`
- Modify the value with `map`
- Modify the value or introduce errors with `flatMap`
- Use the value but ignore the result with `tap`
- Combine the value of multiple effects with `all`

notes:
Most of our Effect code will take place in pipes where we can transform a value through multiple functions. We can manipulate the values of an Effect with map and flat map, trigger side effects with tap, and combine multiple effects with all

---

### Generators
- alternative syntax similar to async/await
- completely optional
- `Effect.gen(function* (_) { yield* _(effect); }`

notes:
Generators are a optional way to write logic in Effect that is similar to async await for promises. It uses yield * adapter function to unwrap the value from an effect, while still bubbling up any errors. 

---

### Error Handling
- Errors "short circuit" normal execution immediately
- `readonly _tag: string` field to discriminate types
- Catching errors
	- All errors: `catchAll`
	- Specific error: `catchTag`
	- Multiple specific errors: `catchTags`

notes:
Errors in effect stop the execution of the 'happy error free path' immediately. They most often take the form of objects with a `_tag` field to discriminate them. To catch errors present in our pipelines we can use the catch functions to choose what errors to handle and how to recover from them.

---

### Adding Requirements
(for `Effect<R, E, A>`)
- `Context.Tag<T>` creates a placeholder that we can use in our pipelines and adds `T` to the `R` field of the Effect
- An Effect whose `R` isn't `never` cannot be run
- `Effect.provideService` fills that placeholder
	- can be done anywhere before the effect is run

notes:
We can create dependencies for our effects by defining a tag for some type and using it in our effects. We must then provide a actual value of that type before the effect can be run using Effect.provideService

---

### Logging
- `Effect.log*`
	- Debug, Info, Warning, Error, Fatal
- The minimum log level can be modified
- `Effect.withLogSpan` for timing things

notes:
finally, Effect provides 5 different levels of logging with the ability to modify what levels are actually written out to the console, and using the `withLogSpan` function we can time portions of our programs.

---

### Effect is really big

notes:
These are just the most basic concepts in Effect, the iceberg goes way deeper. But don't feel overwhelmed by Effect's size. Focus on learning the most commonly used functions and patterns and move on the more advanced stuff when your ready for it.

---
### Additional Resources
- Effect Docs
	- This video has a lot of overlap with the "Effect Essentials" sections
- Effect API Reference
	- The type signatures can look at bit scary but don't be afraid to look something up in here
- Effect Discord
	- Dedicated beginner channels to help you!
- Github repo containing the code in this video

notes:
This video is just a starting place for your journey learning Effect. The Effect docs are the best place to go from here. You can review the concepts in this video in the "Effect Essentials" section, or move on to other things you find interesting. The Effect API Reference sites can also be a helpful resource to check out.

Finally the Effect discord is a great community of Effect developers that want to help you learn, so consider joining.

Links to all of that and a github repo containing every snippet in this video, along with the pokemon example program at each iteration is available in the description.

Once again, thank you to the Effect team for sponsoring this video

---
```ts
console.log("till next time")
``` 

notes:
If you enjoyed this video consider subscribing.

As always, the transcript and markdown source code are also available on my github, link in the description, and any corrections will be in the pinned comment.

Thank you for watching, and I'll see you in the next video.