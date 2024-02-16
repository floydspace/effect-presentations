---
theme: css/nn.css
highlightTheme: css/github-dark-default.css
---
<style>
code.language-typescript {
  font-size:  1em;
  line-height: 1.5em;
}
</style>

<img src="attachments/effect-logo2.png" alt="My Image" style="filter: invert(1); border: none" />
## Effect:
## Is it "TypeScript"?

notes:
Effect introduces concepts and apis brand new to most typescript developers. So, is it 'typescript'?

---

*"Effect is too different and complex"*

notes:
What do I mean by this? Some of the initial reactions I see to Effect are concerned about Effect's patterns being too distant from 'normal traditional' typescript, and in some ways, they're correct.

---

**Effect is different**

notes:
Effect is something new, a new way to solve our long existing problems with javascript and typescript.

---

<!-- ```ts
function fn(): number throws Error { ... }
``` -->
<pre>
<code class="language-typescript">function fn(): number throws Error { ... }</code></pre>

![[throws-issue-closed.png]]
notes:
A typescript pr back from 2016 asking for functions to be able to declare what they throw was recently closed by the typescript team.

why? well according to them
- Existing libraries tend to not declaring what errors they throw in their documentation, let alone their types
- and that the pattern of using `instanceof` in catch clauses is fine
---

<!-- ```ts
function parseNumber(input: string): number throws Error { ... }
function validateNumber(num: number): boolean throws Error { ... }

function processInput(input: string): void throws Error {
  try {
    const num = parseNumber(input);
    try {
      const isValid = validateNumber(num);
      if (!isValid) {
        throw new Error("Number is invalid");
      }
    } catch (validationError) {
      // handle validation error
    }
  } catch (parsingError) {
    // handle parsing error
  }
}
``` -->
<pre>
<code class="language-typescript" style='line-height:1.1em; font-size:.9em'>function parseNumber(input: string): number throws Error { ... }
function validateNumber(num: number): boolean throws Error { ... }

function processInput(input: string): void throws Error {
  try {
    const num = parseNumber(input);
    try {
      const isValid = validateNumber(num);
      if (!isValid) {
        throw new Error("Number is invalid");
      }
    } catch (validationError) {
      // handle validation error
    }
  } catch (parsingError) {
    // handle parsing error
  }
}</code></pre>


typed errors!... but still kinda sucks

notes:
a lot of people were upset about this outcome,

but think about even if this got merged, would this still be the typescript we wanted?
a language fundamentally based around try catch?
a language built around a flawed async primitive, promise?

---
You can do quite a lot with TypeScript

notes:

For all of its flaws, TypeScript has a lot going for it. 

---
<!-- ```ts
import { Query } from "@codemix/ts-sql";

const db = {
  things: [
    { id: 1, name: "a", active: true },
    { id: 2, name: "b", active: false },
    { id: 3, name: "c", active: true },
  ],
} as const;

type ActiveThings = Query<
  "SELECT id, name AS nom FROM things WHERE active = true",
  typeof db
>;

// ActiveThings is now equal to the following type:
type Expected = [{ id: 1; nom: "a" }, { id: 3; nom: "c" }];
``` -->
<pre>
<code class="language-typescript" style='line-height:1em'>import { Query } from "@codemix/ts-sql";

const db = {
  things: [
    { id: 1, name: "a", active: true },
    { id: 2, name: "b", active: false },
    { id: 3, name: "c", active: true },
  ],
} as const;

type ActiveThings = Query&lt;
  "SELECT id, name AS nom FROM things WHERE active = true",
  typeof db
&gt;;

// ActiveThings is now equal to the following type:
type Expected = [{ id: 1; nom: "a" }, { id: 3; nom: "c" }];</code></pre>

SQL databse in type system

notes:
It's type system punches far above its weight, while the underlying javascript is still hacky enough to enable really neat features for library authors that know what they are doing.

Effect embraces typescript for what it is, while pushing it to do the absolute most possible through new apis.

---

## Effect is just TypeScript

notes:

Effect accomplishes this by bringing the best features of other languages, typed errors and managed side effects (along with a powerful ecosystem around them) to pure native typescript

---

```
npm install effect
```

^ thats it

notes:
I say this in that Effect introduces zero new syntax. It requires no transpilation or compliation step. 
you just npm install and run however you did before. This is important and intentional.

---

Effect isn't *like* "TypeScript"

notes:

But obviously Effect is also not exactly traditional ‘typescript’: traditional typescript throws and runs side effects eagerly, where Effect provides different tools

---

<!-- ```ts
Effect.all(userIds.map(fetchUserEffect), {
    concurrency: 10,
})
``` -->
<pre>
<code class="language-typescript">Effect.all(userIds.map(fetchUserEffect), {
    concurrency: 10,
})</code></pre>

Fair amount of magic going on here

notes:
This level of additional functionality over traditional typescript isnt free, it can't be. The implementation of new features has to happen somewhere.

---
Before:
<!-- ```ts
function getRandomTimesTwo() {
	const rng = new RNG();
	try {
		return rng.next() * 2;
	} catch {
		return -1
	}
}
``` -->
<pre>
<code class="language-typescript" style="line-height:1.1em; font-size: .9em">function getRandomTimesTwo() {
	const rng = new RNG();
	try {
		return rng.next() * 2;
	} catch {
		return -1
	}
}</code></pre>


After:

<!-- ```ts
const getRandomTimesTwo = Effect.gen(function* (_) {
  const rng = yield* _(RNG);
  return yield* _(rng.next());
}).pipe(Effect.orElse(() => Effect.succeed(-1)));
``` -->
<pre>
<code class="language-typescript">const getRandomTimesTwo = Effect.gen(function* (_) {
  const rng = yield* _(RNG);
  return yield* _(rng.next());
}).pipe(Effect.orElse(() =&gt; Effect.succeed(-1)));</code></pre>


notes:
and its true that this means that your code may look slightly different, and a new dev may have a 'ramp-up' time before feeling comfortable

add its also true, that this means in basic examples traditional code might be simpler or shorter

but we arent building simple apps

---

### Were here to build things that scale
Effect is TypeScript that scales

notes:

Today, TypeScript is a language used to build full stack app applications that serve millions of users.

At this scale, you can not escape complexity, only manage it.

The time it takes you and your team to learn and adopt Effect is far less than the cost of trying to do things the flawed traditional way, or designing an inferior abstraction yourself

and all things considered, Effect isnt that bad to pick up

---

Effect is for the common dev

notes:
Effect is designed to be as approachable as possible for the common developer. It balances purity from the functional world with practicality and familiarity.

---

![[effect-docs.png]]

notes:
The Effect documentation does a great job at explaining Effect's possibly new concepts. Although the Effect docs are no where near complete, the Effect team is working hard to improve them. There’s still a lot to cover but what's there right now is very high-quality and more than enough to get started.

---

![[monad-MIA.jpg|600]]

notes:

And don't worry if you know about functional programming and all of the hard to understand abstract jargon associated with it, none of it is necessary when using Effect.

Search for "monad", "functor" or "applicative" in the effect docs, and youll find they are nowhere to be found.

These and other functional programming concepts are powerful, and drive effect underneath all the abstraction, but Effect is designed so that the apis it provides are easy to understand and use without a phd.

---

Why?
<!-- ```ts
import { Effect } from 'effect';
const foo = Effect.all([foo, bar]).pipe(
  Effect.flatMap(([a, b]) => divide(a, b)),
  Effect.map((n1) => increment(n1)),
  Effect.map((n2) => `Result is: ${n2}`)
)
``` -->
<pre>
<code class="language-typescript" style="font-size: .88em">import { Effect } from 'effect';
const foo = Effect.all([foo, bar]).pipe(
  Effect.flatMap(([a, b]) => divide(a, b)),
  Effect.map((n1) => increment(n1)),
  Effect.map((n2) => `Result is: ${n2}`)
)</code></pre>

and not?
<!-- ```ts
import { EffectClass } from 'effect';
const foo = Effect.all([foo, bar])
  .flatMap(([a, b]) => divide(a, b))
  .map((n1) => increment(n1))
  .map((n2) => `Result is: ${n2}`);
``` -->
<pre>
<code class="language-typescript" style="font-size: .88em">import { EffectClass } from 'effect';
const foo = EffectClass.all([foo, bar])
  .flatMap(([a, b]) => divide(a, b))
  .map((n1) => increment(n1))
  .map((n2) => `Result is: ${n2}`);</code></pre>

notes:
Two semantic things you are likely to quicky notice about Effect code is the use of functions instead of methods and and `pipe`

these may be slightly different to patterns you used to, but give me a chance to explain them

---

<!-- ```rust
struct Foo;

impl Foo {
    fn bar(self) {}
}

fn main() {
    let x = Foo;
    Foo::bar(x);
    let x = Foo;
    x.bar();
}
``` -->
<pre>
<code class="language-rust">struct Foo;

impl Foo {
    fn bar(self) {}
}

fn main() {
    let x = Foo;
    Foo::bar(x);
    let x = Foo;
    x.bar();
}</code></pre>


These two calls to `foo` are identical

notes:
Whether your following a functional or object oriented paradigm, most of code in theory is the same. A series of transformers to some data. Here in rust, a method and a function that takes the data as its first argument are completely identical and compile to the exact same assembly, and if you don't use a certain method it gets compiled away and never makes it to the final binary.

---

<!-- ```ts
class Foo {
	bar() {}
}

let x = new Foo();
x.bar();
Foo.prototype.bar.call(x);
``` -->
<pre>
<code class="language-typescript">class Foo {
	bar() {}
}

let x = new Foo();
x.bar();
Foo.prototype.bar.call(x);</code></pre>


<!-- ```ts
function bar(self: Foo) {}
bar(x);
``` -->
<pre>
<code class="language-typescript">function bar(self: Foo) {}
bar(x);</code></pre>


These are different

notes:
But back in javascript things are quite different. When we create a method on a class that method exists on the prototype chain for every instance of that class, even if its never used. 

---

<!-- ```ts
class Foo {
	bar() {}
}

Foo.prototype.logBar = function() { console.log(this.bar()) }

class MyFoo extends Foo {
	logBar() { console.log(this.bar()) }
}
``` -->
<pre>
<code class="language-typescript">class Foo {
	bar() {}
}

Foo.prototype.logBar = function() { console.log(this.bar()) }

class MyFoo extends Foo {
	logBar() { console.log(this.bar()) }
}</code></pre>


Not ideal

notes:
additionally classes have the downside of being difficult to extend with your own custom functions

you forced to either create a wrapper class, or directly modify the existing prototype

---

<!-- ```ts
// Foo.ts
function bar(self: Foo) {}

// index.ts
import * as Foo from './Foo.ts'
let x = new Foo();
Foo.bar(x);
pipe(x, Foo.bar);
``` -->
<pre>
<code class="language-typescript">// Foo.ts
function bar(self: Foo) {}

// index.ts
import * as Foo from './Foo.ts'
let x = new Foo();
Foo.bar(x);
pipe(x, Foo.bar);</code></pre>

Namespaced functions

notes:
The apis in Effect are seriously big. effect/io/Effect  has over 300 functions. In reality though you'll probably only use 10-20 consistently in most code. But what about all those other unused functions? If they were all under one class it would be impossible for a bundler to tree shake them.

---
Massive Bundle:
<!-- ```ts
import { EffectClass } from 'effect';
const foo = EffectClass.all([foo, bar])
  .flatMap(([a, b]) => divide(a, b))
  .map((n1) => increment(n1))
  .map((n2) => `Result is: ${n2}`);
``` -->
<pre>
<code class="language-typescript" style="font-size: .9em">import { EffectClass } from 'effect';
const foo = EffectClass.all([foo, bar])
  .flatMap(([a, b]) => divide(a, b))
  .map((n1) => increment(n1))
  .map((n2) => `Result is: ${n2}`);</code></pre>


Tree Shaken:

<!-- ```ts
import { Effect } from 'effect';
const baz = Effect.all([foo, bar]).pipe(
  Effect.flatMap(([a, b]) => divide(a, b)),
  Effect.map((n1) => increment(n1)),
  Effect.map((n2) => `Result is: ${n2}`)
)
``` -->
<pre>
<code class="language-typescript" style="font-size: .9em">import { Effect } from 'effect';
const baz = Effect.all([foo, bar]).pipe(
  Effect.flatMap(([a, b]) => divide(a, b)),
  Effect.map((n1) => increment(n1)),
  Effect.map((n2) => `Result is: ${n2}`)
)</code></pre>

notes:

Thats why Effect uses doesn't use methods. each effect module consists of many of top level functions, if you dont use one, your bundler will throw it away at build time.

This means when making your own custom functions, its easy. No prototype modification neccessary.

And with pipe the code comes out looking pretty similar to a traditional chained method approach.

---

`pipe`

<!-- ```ts
const result = pipe(input, func1, func2, ..., funcN)
``` -->
<pre>
<code class="language-typescript">const result = pipe(input, func1, func2, ..., funcN)</code></pre>


![[pipe-mermaid.png]]

notes:
Pipe is a simple but powerful tool to chain successive operations. It takes a starting piece of data and a series of functions. It starts by calling the first function with the input data, then calls the next function with the result of the previous function, and so on. It's important to note that functions passed to `pipe` must have a **single argument** because they are only called with a single argument, the result of the previous function.

---

<!-- ```ts
const increment = (x: number) => x + 1
const double = (x: number) => x * 2
const subtractTen = (x: number) => x - 10
 
const result = pipe(5, increment, double, subtractTen)
// identical to subtractTen(double(increment(5)))
 
console.log(result) // Output: 2
``` -->
<pre>
<code class="language-typescript">const increment = (x: number) => x + 1
const double = (x: number) => x * 2
const subtractTen = (x: number) => x - 10
 
const result = pipe(5, increment, double, subtractTen)
// identical to subtractTen(double(increment(5)))
 
console.log(result) // Output: 2</code></pre>


notes:

Just like method chaining, pipe makes it easy to view a left to right or top to bottom series of transformations while avoiding hard to read nested function calls.

---
<!-- ```ts
Effect.map(myEffect, data => data + 1)
``` -->
<pre>
<code class="language-typescript">Effect.map(myEffect, data => data + 1)</code></pre>

"data" as first argument

notes:
In Effect you can use every function in two ways.

The first way is by passing the "data", or the main input the function is acting on, as the first argument. This is most convenient when just calling a single function. 

---
<!-- ```ts
pipe(
  myEffect,
  (effect) => Effect.map(effect, data => data+1)
)
``` -->
<pre>
<code class="language-typescript">pipe(
  myEffect,
  (effect) => Effect.map(effect, data => data+1)
)</code></pre>

This is a bit annoying

notes:
but if this was the only option, when using functions that take additional arguments after the first in a pipe, you need to use a anonymous wrapper function which is inconvientent

---

<!-- ```ts
Effect.map(data => data + 1)(myEffect)
``` -->
<pre>
<code class="language-typescript">Effect.map(data => data + 1)(myEffect)</code></pre>

"data" as argument to returned function

notes:
This leads us to the second way to call functions. Leaving out the "data" from the original function call will cause it to return another function that takes the data as its only argument. 

---

<!-- ```ts
pipe(
  myEffect,
  Effect.map(data => data + 1)
)
``` -->
<pre>
<code class="language-typescript">pipe(
  myEffect,
  Effect.map(data => data + 1)
)</code></pre>

Much better

notes:
This method is perfect for use in pipe lines when chaining multiple operations.

---

Custom functions with `dual`

<!-- ```ts
import { pipe, Function } from 'effect';

const sum: {
  (that: number): (self: number) => number
  (self: number, that: number): number
} = Function.dual(2, (self: number, that: number): number => self + that)

sum(2, 3) === 5
pipe(2, sum(3)) === 5
``` -->
<pre>
<code class="language-typescript" style="font-size:.8em">import { pipe, Function } from 'effect';

const sum: {
  (that: number): (self: number) => number
  (self: number, that: number): number
} = Function.dual(2, (self: number, that: number): number => self + that)

sum(2, 3) === 5
pipe(2, sum(3)) === 5</code></pre>


notes:

earlier, I mentioned about it being easy to make your own custom functions in Effect
with `dual` your custom functions can get the same dual calling options as built in Effect functions.

---

## Different is good

notes:
Throughout your Effect journey you will continue to see new patterns such as these.

If you are familiar with Rust, you know that it was not afraid to completely re-imagine memory management for a low level language to achieve the safety desired. 

Similarly, Effect is not afraid to challenge the status quo of programming in TypeScript.

If some parts are unfamiliar, that's kind of the point. TypeScript is flawed and if we want things to be different, our code will need to look different too.

---

## *but*, compatibility is also good

<!-- ```ts
import express, { Request, Response } from "express";
import { Effect, Exit, Cause } from "effect";

declare const fetchUsersEffect: Effect.Effect<never, Error, Data>;
const app = express();

app.get("/users", (req: Request, res: Response) => {
  Effect.runPromiseExit(fetchUsersEffect).then(
    Exit.match({
      onSuccess: (data) => res.send(data),
      onFailure: (cause) => res.status(500).send(Cause.pretty(cause)),
    })
  );
});
``` -->
<pre>
<code class="language-typescript" style="line-height:1.2em; font-size:.9em">import express, { Request, Response } from "express";
import { Effect, Exit, Cause } from "effect";

declare const fetchUsersEffect: Effect.Effect&lt;never, Error, Data&gt;;
const app = express();

app.get("/users", (req: Request, res: Response) =&gt; {
  Effect.runPromiseExit(fetchUsersEffect).then(
    Exit.match({
      onSuccess: (data) =&gt; res.send(data),
      onFailure: (cause) =&gt; res.status(500).send(Cause.pretty(cause)),
    })
  );
});</code></pre>


notes:
Effect provides these new patterns while remaining a pure typescript library ready to sit side-by-side with your existing code. See here with this express example.

---
![[cory-house-tweet-1.png]]
notes:
While attempting to write the conclusion for this video I came across this tweet from Cory House which put things better than I could. The tweet is about the transition from javascript to typescript

---
![[edit-tweet-1.png]]
notes:
but the argument is the exact same for going from traditional typescript to Effect. Its worth a second look if you're skeptical.

---

![[cory-house-tweet-2.png]]

notes:
Cory correctly points out that many initial complaints about TypeScript were misplaced. It does make your code slightly more verbose and complex in some places, but the complexity it **prevents** in other places is exponentially bigger.

---
![[edit-tweet-2.png]]

notes:
Effect does the exact same thing but now on an additional level to what traditional typescript provides, with as few compromises as possible. 

Just as with TypeScript, once you get past the initial learning curve of Effect, you find that the increased ability to express errors, control side effects and manage complexity leads to cleaner, more robust code.

---

## Effect is *better* TypeScript

notes:

Effect is the typescript I wish we always had, and hopefully soon you will too.

---

<!-- ```ts
console.log("till next time")
``` -->
<pre>
<code class="language-typescript">console.log("till next time")</code></pre>

notes:
If you enjoyed this video consider subscribing.

As always, the transcript and markdown source code to this video are available on my github, link in the description, and corrections will be in the pinned comment.

Thank you for watching, and I'll see you in the next video.
