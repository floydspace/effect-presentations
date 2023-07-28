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
</Presentation>
