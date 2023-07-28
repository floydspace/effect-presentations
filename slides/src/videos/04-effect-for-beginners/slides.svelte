<script lang="ts">
	import { Presentation, Slide, Media, Code, Step } from '@components'
	import Layout from '@shared/layout.svelte'
	import effectLogo from '@attachments/effect-logo.png'
	import pipeMermaid from '@attachments/pipe-mermaid.png'
	import snorlax from '@attachments/143-Snorlax.webp'
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
			<Code lines={false}>
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

	<Slide animate>
		<Layout>
			<h1 class="text-6xl">Find the heaviest Pokemon!</h1>
			<img src={snorlax} alt="Snorlax" class="h-48" />
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1 class="text-6xl">Find the heaviest Pokemon!</h1>
			<div class="flex flex-row gap-x-16">
				<img src={snorlax} alt="Snorlax" class="h-48" />
				<div class="text-left space-y-5">
					<li>Generate random numbers</li>
					<Step><li>Get Pokemon data from API</li></Step>
					<Step><li>Validate returned JSON</li></Step>
					<Step><li>Find the heaviest Pokemon</li></Step>
				</div>
			</div>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="|1">
				{`
					// type: Effect<never, Error, any>
					const getPokemon = (id: number) =>
						Effect.tryPromise({
								try: () => fetch(\`https://pokeapi.co/api/v2/pokemon/\${id}\`)
									.then((res) => res.json()),
								catch: (e) => new Error("error fetching pokemon: \${e.message}")
						}),
		  	`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>@effect/schema</h1>
			<Code lang="ts" lines="|3-6|8-9">
				{`
					import * as Schema from "@effect/schema/Schema";

					const pokemonSchema = Schema.struct({
						name: Schema.string,
						weight: Schema.number,
					});

					type Pokemon = Schema.To<typeof pokemonSchema>;
					const parsePokemon = Schema.parseEither(pokemonSchema);
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>validation!</h1>
			<Code lang="ts" lines="9|1">
				{`
				// returns: Effect<never, Error | ParseError, Pokemon>
				const getPokemon = (id: number) =>
				  pipe(
				    Effect.tryPromise({
					    try: () => fetch(\`https://pokeapi.co/api/v2/pokemon/\${id}\`)
								.then((res) => res.json()),
							catch: (e) => new Error("error fetching pokemon: \${e.message}")
				    }),
				    Effect.flatMap((x) => parsePokemon(x))
				  );
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="|4">
				{`
				// type: Effect<never, never, number>[]
				const getRandomNumberArray = 
					Array.from({ length: 10 }, () =>
					    Effect.sync(() => Math.floor(Math.random() * 100) + 1)
					)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="1,7-8">
				{`
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
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="3|4|1">
				{`
				// type: Effect<never, Error, Pokemon[]>
				const program = pipe(
					getRandomNumberArray,
					Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
				)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="7">
				{`
				// type: Effect<never, Error, Pokemon[]>
				const program = pipe(
					getRandomNumberArray,
					Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
				)

				Effect.runPromise(program).then(console.log)
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lines={false} data-id="new">
				{`
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
			`}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="1-2|7-9">
				{`
				const formatPokemon = (pokemon: Pokemon) =>
				  \`\${pokemon.name} weighs \${pokemon.weight} hectograms\`;

				const program = pipe(
				  getRandomNumberArray,
				  Effect.flatMap((arr) => Effect.all(arr.map(getPokemon)))
				  Effect.tap((pokemons) =>
				    Effect.log("\\n" + pokemons.map(formatPokemon).join("\\n"))
				  ),
				);
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines={false}>
				{`
				const calculateHeaviestPokemon = (pokemons: Pokemon[]) =>
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="3-7|5|1">
				{`
				// return type: Effect<never, Error, number>
				const calculateHeaviestPokemon = (pokemons: Pokemon[]) =>
				  Effect.reduce(pokemons, 0, (highest, pokemon) =>
					pokemon.weight === highest
					  ? Effect.fail(new Error("two pokemon have the same weight!"))
					  : Effect.succeed(pokemon.weight > highest ? pokemon.weight : highest)
				  );
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts">
				{`
				const program = pipe(
				  getRandomNumberArray,
				  Effect.flatMap((arr) => Effect.all(arr.map(getPokemon))),
				  Effect.tap((pokemons) =>
						Effect.log("\\n" + pokemons.map(formatPokemon).join("\\n"))
				  ),
				  // Effect<never, Error, Pokemon[]>
				);
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="8-13">
				{`
				const program = pipe(
				  getRandomNumberArray,
				  Effect.flatMap((arr) => Effect.all(arr.map(getPokemon))),
				  Effect.tap((pokemons) =>
						Effect.log("\\n" + pokemons.map(formatPokemon).join("\\n"))
				  ),
				  // Effect<never, Error, Pokemon[]>
				  Effect.flatMap((pokemons) => calculateHeaviestPokemon(pokemons)),
				  // Effect<never, Error, number>
				  Effect.flatMap((heaviest) =>
						Effect.log(\`The heaviest pokemon weighs \${heaviest} hectograms!\`)
				  )
				  // Effect<never, Error, void>
				);
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="8-13">
				{`
				// type: Effect<never, Error, void>
				const program = pipe(
					// ...
				);
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code>
				{`
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
				timestamp=2023-... level=INFO fiber=#0
				message="The heaviest pokemon weighs 756 hectograms!"
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1 class="font-bold text-8xl">Generators</h1>
			<h3>async/await for Effect</h3>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="|4|1,6|3|">
				{`
				declare const imAnEffect: Effect<never, Error, number>;

				// type: Effect<never, Error, string>
				const program = Effect.gen(function* (_) {
					// type: number
					const valueOfEffect = yield* _(imAnEffect);
					return String(valueOfEffect);
				})
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Before:</h1>
			<Code lang="ts">
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
			<h1>After:</h1>
			<Code lang="ts" lines="|5|4">
				{`
				// type: Effect<never, Error, void>
				const after = Effect.gen(function* (_) {
					const x = yield* _(getRandomNumber);
					const y = x * 2;
					const z = yield* _(checkIfAtLeastFive(y));
					yield* _(logNumber(z));
				});
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<h1>Generators are Optional</h1>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts" lines="|4-11|13">
				{`
				// type: Effect<never, unknown, Pokemon>
				const getPokemon = (id: number) =>
				  Effect.gen(function* (_) {
					const res = yield* _(
					  Effect.tryPromise({
						try: () =>
						  fetch(\`https://pokeapi.co/api/v2/pokemon/\${id}\`).then((res) =>
							res.json()
						  ),
						catch: () => new Error("error fetching pokemon"),
					  })
					);
					return yield* _(parsePokemon(res));
				  });
		  `}
			</Code>
		</Layout>
	</Slide>

	<Slide animate>
		<Layout>
			<Code lang="ts">
				{`
				// type: Effect<never, unknown, void>
				const program = Effect.gen(function* (_) {
				  const arr = yield* _(getRandomNumberArray);
				  const pokemons = yield* _(Effect.all(arr.map(getPokemon)));
				  yield* _(Effect.log("\\n" + pokemons.map(formatPokemon).join("\\n")));
				  
				  const heaviest = yield* _(calculateHeaviestPokemon(pokemons));
				  yield* _(Effect.log(\`The heaviest pokemon weighs \${heaviest} hectograms!\`));
				});
		  `}
			</Code>
		</Layout>
	</Slide>
</Presentation>
