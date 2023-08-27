(full cam)
So you may or may not have seen a video from this kind of small youtuber named theo about the dangers of promise.all, but you may not have seen this clip from right after he finishes recording.

Theo correctly points out a common footgun of using promise.all, the fact that if even a single promise passed to it rejects, so does the entire collective promise, even if the rest resolve without errors. Theo recommends using promise.allSettled instead, and while this does improve things, it still suffers from issues with the promise API itself. I'm gonna explain why and give a potential solution using a library you might have heard of called effect to make working with async even more robust.

(diagram #1)
- root problem is we want to await multiples promise concurrently
	- otherwise we could just await one at a time
	- promise.all is usually the go to reccomendation
- the problem is sometimes things error
(concurent error handling diagram)
- When an error occurs we have two options
	- the first is what's called 'short circuiting' where the entire operation failed upon the first encountered error
		- think of this like an uncaught exception, as soon as its thrown the entire program comes crashing down
	- The other option collects all results, whether successes or errors and holds for somewhere upstream to handle
		- think of this link returning T | Error from a function
- Both of these behaviors are valid options and which one you should go with depends on your situation
(diagram #2)
- In theo's video he argues against using promise.all becuse of its short circuit behavior
	- show example
	- theos argument is that not only is it wasteful to through away potentially good data
- and instead recommends promise.allSettled for its ability to collect the errors, and not throw away good data just because one small piece failed
- but the problems dont end with promise.allSettled
(diagram #3)
	- now that we have errors as values, we want to be able to work with them
	- but this is where we get to a fundamental issue with the promise api itself, its only generic over 1 type, if it rejects with some value you have no clue what type it will be
	- we can see this in the code required to filter the sucesses from errors in promise.allSettled
		- promise.allSettled returns a `PromiseSettledResult<Number>[]` which we can see is either a `PromiseFulfilledResult<T> | PromiseRejectedResult`
		- setting aside the verbosity of dealing with filtering this type
		- notice how project rejected result isnt even generic, it could literally be anything
		- why should our type safety fall apart when things error, isnt that when it might be the most useful for helping us decide how to handle those errors?
- my goal with the rest of the video is to prove to you that Effect.all > Promise.all or Promise.allSettled
- what is effect?
	- bare minimum explanation just so you can understand the code to follow
	- an effect is a value that represents an operation that results in either an error or a value, both of which are fully typed
- before we can use effect.all instead of promise.all, we need to convert our functions that return promises, to functions that return effects- but this is super simple
	- first the `WORK` funciton: effect uses generations to provide some syntactic sugar which enables our new function to look line for line almost identical to the previous (feel free to pause and compare for yourself)
		- the main thing to focus on is the line where we error if the number is a 4
		- where previous we threw an untyped exception, now we return an explict `FourError`, which even shows up in the return type
	- next the `MAIN` function
		- again we are line for line nearly identical to before
		- this time instead of a array of promises, we have an array of effects, then use Effect.all to get the results
			- you might notice this concurrency: unbounded argument
			- this is because effect.all's default behavior runs effects one at a time, so we have to explictly tell it to run them concurrently. Setting this to "unbounded" mimics the behavior of promise.all
		- notice how that `FourError` from before has bubbled up to the return type of the main function, this tells us at a type level that this function could error and what that error would be- something we could never do before with plain promises
		- finally we have some code to catch that error and log out a message if so, but again fully typesafe, in this handle function error is typed as `FourError` because we know thats the only possible error in our program
		- finally we pass this to runPromise to run our effect
- and now we get the exact same behavior as promise.all, but now instead of unknown or any, our errors are fully typed
- but that also means we have the exact same short circuit behavior theo was trying to avoid
	- lets use effect but do something similar to promise.allSettled
- This requires just a single function to implement, Effect.either
	- Effect.either is just like how promise.allSettled gives us the result when the promise resolves or rejects, but again this time fully typed
	- you might wonder what this Either type is
		- its basically just like a union, but comes with guards, pattern matching and mapping out of the box
- our new function again looks like for line quite similar to before
	- we map over our effects with Effect.either and pass it to Effect.all just like before
	- instead of the mess we had before, now everything is clean and again fully typed, even the errors
- and when we run it we see we get the exact same collection behavior as promise.allSettled

- as you can see, by Effect and Effect.all, we have given ourself typesafey not only on the happy path, but when things go wrong as well
- however while theo's advice is good, there are still situations where you might want to short circuit on error, as this week in react author seb pointed out on [twitter](https://twitter.com/sebastienlorber/status/1691510563162013696?s=20)
- the problem becomes, as theo points out in his video
	- even though main finished, and the rest of the promises are completely gone to use as devs, the  setTimeouts are still going off
	- imagine a real application where these promises could be doing network requests or database calls, all while you will never see the result of any of that work
	- an ideal short circuit solution requires us to interrupting the other tasks after one fails
- lets take a look at the other half of this diagram ive been hiding away
- with promises we can use the AbortController API to do this, lets take a look at an example
	- in our new wait for function, we now take an abort signal as an argument and clear the timeout on the `abort` event
	- we modify work to just pass this signal through
	- finally, in main we create a new controller and pass the singal to all our work_abortable calls
	- if we catch because the promise.all rejects, we call abort clearing the remaining timeouts
- and if we run it, this does work but theres still some downsides
- you have to create and manage abort controllers, it may be simple in this example but when you have many layers of functions and multiple abort sources, will you be able to keep track of all of it?
- the effect runtime makes this easy by providing you an abort signal tied to the underlying fiber in the effect runtime
	- fibers are like like weight threads 
- effect provides this to the promise and tryPromise constructors we were already using, so the only change we need to make is to pass this signal to wait for abortable
- because wait for abortable rejects when its interrupted, i created a new class `WaitForError` to make that error typed instead of unknown
- and its that easy, full interruption

-  the final thing I want to talk about is limiting concurrency
- promise.all and promise.allSettled both have unbounded concurrency
	- if you pass an array with 1000 promises, its going to run them all and probably crash your users page
- if we want to have so called controlled concurrency, where we set a specific maximum number of promises that can be running at one time we have to use a async queue
	- which looks like this
	- its actually a good exercise to try implementing this yourself but it would be nice to avoid all of *this* if possible
- with effect, controlled concurrency is easily achieved by just passing a number to the concurrency argument 

- working with async is hard, especially when we want to have code that doesn't blow up just because a single promise decides to reject
- effect allows us to bring typesafety to our errors as well as enabling many more new features
- so if you were interested by what you saw in this video definitely give effect a try
- I have a full 30 minute basic effect tutorial on the screen now which is a great place to go from here
- but also check out the effect docs on the website link in the description
- the link to a live version of the this website and all of the code for it will also all be in the description so go check that out as well
- thanks for watching and ill see you in the next video