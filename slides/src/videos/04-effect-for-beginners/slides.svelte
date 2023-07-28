<script lang="ts">
	import { Presentation, Slide, Media, Code } from '@components'
	import Layout from '@shared/layout.svelte'
	import effectLogo from '@attachments/effect-logo.png'
	import pipeMermaid from '@attachments/pipe-mermaid.png'
</script>

<Presentation>
	<Slide animate>
		<Layout>
			<h1 class="font-bold text-8xl">Effect for Beginners</h1>
			<img src={effectLogo} alt="logo" class="h-48 w-48" />
			<h3>A guide through Effect's core concepts</h3>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1 class="font-bold text-5xl">Sponsored By:</h1>
			<h3 class="text-3xl">The Effect Team</h3>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code>
				{`
					npm install effect
					yarn add effect
					pnpm add effect
				`}
			</Code>
			<br />
			<Code lang="ts">
				{`
					import { Effect } from "effect"
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>The Effect type</h1>
			<Code lang="ts">
				{`
					type Effect<Requirements, Error, Value> = (
						requirements: Requirements
					) => Error | Value;
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>The unit Effect</h1>
			<Code lang="ts">
				{`
					type Unit = Effect<never, never, void>;

					// can think of being like
					const unit = () => {}
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>A simple Effect</h1>
			<Code lang="ts">
				{`
					type Simple = Effect<never, Error, number>;
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Creating Effects</h1>
			<Code lang="ts" lines="|1-2|4-5">
				{`
					// type: Effect<never, never, number>
					const success = Effect.succeed(42);

					// type: Effect<never, Error, never>
					const failure = Effect.fail(new Error());
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Effects compose together</h1>
			<Code lang="ts" lines="|2|3|5|1">
				{`
					function divide(x: number, y: number): Effect.Effect<never, Error, number> {
						if (y === 0) {
							return Effect.fail(new Error("divide by zero"));
						}
						return Effect.succeed(x / y);
					}
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Delaying Computations</h1>
			<Code lang="ts">
				{`
					const log = Effect.succeed(console.log("dont do this"));
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Synchronous computations</h1>
			<Code lang="ts" lines="|3|4|1">
				{`
					// type: Effect<never, never, number>
					const program = Effect.sync(() => {
						console.log("Hello, World!") // side effect
						return 42 // return value
					})
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Synchronous computations that could throw</h1>
			<Code lang="ts" lines="|3|4|1">
				{`
					// type: Effect<never, Error, any>
					const program = Effect.try({
						try: () => JSON.parse(""),
						catch: (_caughtError) => new Error("JSON.parse threw an error"),
					});
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Asynchronous computations</h1>
			<Code lang="ts">
				{`
					// type: Effect<never, never, number>
					const promise = Effect.promise(() => Promise.resolve(42));
			    `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Asynchronous computations that could reject</h1>
			<Code lang="ts">
				{`
					// type: Effect<never, unknown, Response>
					const response = Effect.tryPromise({
						try: () => fetch("..."),
						catch: (_caughtError) => new Error("fetch rejected"),
					});
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Running Effects</h1>
			<Code lang="ts">
				{`
					// type: Effect<never, never, number>
					const program = Effect.sync(() => {
						console.log("Hello, World!")
						return 1
					});
					// Console: <blank>
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Running synchronous Effects</h1>
			<Code lang="ts" lines="8-13">
				{`
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
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Running asynchronous Effects</h1>
			<Code lang="ts" lines="6-10">
				{`
					// type: Effect<never, never, number>
					const program = Effect.promise(() => 
						Promise.resolve(42)
					);

					// type: Promise<number>
					const result = Effect.runPromise(program);
					
					result.then(console.log);
					// Console: 1
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Effects are composable... so compose them</h1>
			<Code lang="ts" lines="6-10">
				{`
					Effect.succeed(Effect.runSync(myEffect))
					// Please don't do this
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Chaining transformations with pipe</h1>
			<Code lang="ts" lines="6-10">
				{`
					const result = pipe(input, func1, func2, ..., funcN)
			  `}
			</Code>
			<img src={pipeMermaid} alt="logo" class="h-14" />
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="1-3|5-6|8">
				{`
					const increment = (x: number) => x + 1
					const double = (x: number) => x * 2
					const subtractTen = (x: number) => x - 10
					
					const result = pipe(5, increment, double, subtractTen)
					// identical to subtractTen(double(increment(5)))
					
					console.log(result) // Output: 2
			  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>The pipe method</h1>
			<Code lang="ts">
				{`
				pipe(effect, func1, func2, ...)
				effect.pipe(func1, func2, ...)
				// These are identical
			`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Transforming the value of an effect with map</h1>
			<Code lang="ts" lines="|5">
				{`
				// type: Effect<never, never, string>
				const mappedEffect = pipe(
				  Effect.succeed(1),
				  // "x" type: number
				  Effect.map((x) => String(x))
				)
				 
				console.log(Effect.runSync(mappedEffect)) // Output: "1"
			`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Mapped effect</h1>
			<Code lang="ts" lines="|2|4">
				{`
				const mappedEffect = pipe(
				  Effect.succeed({ x: 5, y: 0 }),
				  Effect.map(({x, y}: { x: number, y: number }) =>
						y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
				  )
				)
			`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>This isn't right</h1>
			<Code lang="ts" lines="7-11">
				{`
				const mappedEffect = pipe(
				  Effect.succeed({ x: 5, y: 0 }),
				  Effect.map(({x, y}: { x: number, y: number }) =>
					y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
				  )
				)
				typeof mappedEffect = Effect<
					never, 
					never, 
					Effect<never, Error, number>
				>;
			`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>We want to the Effects to merge</h1>
			<Code lang="ts">
				{`
				type WhatWeWant = Effect<never, Error, number>;
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Effectful transformations with flatMap</h1>
			<Code lang="ts" lines="4-6|1">
				{`
				// type: Effect<never, Error, number>
				const flatMappedEffect = pipe(
				  Effect.succeed({ x: 5, y: 0 }),
				  Effect.flatMap(({x, y}: { x: number, y: number }) =>
						y === 0 ? Effect.fail(new Error("divide by zero")) : Effect.succeed(x/y)
				  )
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="|1-2|4-8|10-11">
				{`
				// type: Effect<never, never, number>
				const getRandomNumber = Effect.sync(() => Math.random() * 10);

				// returns: Effect<never, Error, number>
				const checkIfAtLeastFive = (x: number) =>
				  x > 5 ? 
						Effect.succeed(x) : 
						Effect.fail(new Error("number is less than 5"));

				// returns: Effect<never, never, void>
				const logNumber = (x: number) => Effect.log(x.toString());
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="2-3">
				{`
				const program = pipe(
				  getRandomNumber,
				  // Effect<never, never, number>
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Normal Typescript</h1>
			<Code lang="ts" lines="6-10">
				{`
					// Normal Typescript
					const getRandomNumber = Math.random() * 10;
					getRandomNumber // 6.687255774479639
					getRandomNumber // 6.687255774479639
					getRandomNumber // 6.687255774479639
		    `}
			</Code>
			<h1>Effect</h1>
			<Code lang="ts" lines="6-10">
				{`
					// type: Effect<never, never, number>
					const getRandomNumber = Effect.sync(() => Math.random() * 10);
					Effect.runSync(getRandomNumber) // 5.302813847147179
					Effect.runSync(getRandomNumber) // 6.935519254857123
					Effect.runSync(getRandomNumber) // 3.2272729578006554 
				`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="4-5">
				{`
				const program = pipe(
				  getRandomNumber,
				  // Effect<never, never, number>
				  Effect.map((x) => x * 2),
				  // Effect<never, never, number>
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="6-7">
				{`
				const program = pipe(
				  getRandomNumber,
				  // Effect<never, never, number>
				  Effect.map((x) => x * 2),
				  // Effect<never, never, number>
				  Effect.flatMap((x) => checkIfAtLeastFive(x)),
				  // Effect<never, Error, number>
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="8-9">
				{`
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
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>The value was consumed by logNumber</h1>
			<Code lang="ts">
				{`
				pipe(
					Effect.succeed(5),
					Effect.flatMap((x) => logNumber(x)),
					Effect.map((x) => x + 1)
					// ^ ERROR: 
					// '+' cannot be applied to types 'void' and 'number'.
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Execute side effects with tap</h1>
			<Code lang="ts" lines="3-5">
				{`
				const program = pipe(
					Effect.succeed(5),
					Effect.tap((x) => logNumber(x)),
					// x is still available!
					Effect.map((x) => x + 1)
				)

				Effect.runSync(program); // 6
				// console: 5
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Consuming multiple Effects with all</h1>
			<Code lang="ts" lines="4-5|">
				{`
				const foo = Effect.succeed(42)
				const bar = Effect.succeed("Hello")
				
				// type: Effect<never, never, [number, string]>
				const combinedEffect = Effect.all([foo, bar])
				
				console.log(Effect.runSync(combinedEffect))
				// console: [42, "Hello"]
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>A real program!</h1>
		</Layout>
	</Slide>
</Presentation>
