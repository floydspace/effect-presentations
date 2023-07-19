---
theme: blood
controls: false
progress: false
highlightTheme: doesntExist
---
<style>
code.language-typescript {
  font-size:  1em;
  line-height: 1.5em;
}
</style>
![[Pasted image 20230718062353.png]]
notes:
If your building a web app today, but tired of all the chaos of frontend frameworks I have the tech stack for you.

---

# The BETH Stack
An opinionated hypermedia-driven web framework

notes:
 The BETH stack is a hypermedia-driven architecture 

---

### DX & Performance

notes:
that prioritizes developer experience first, while still having very strong performance.

---

![[htmx-banner.png]]

notes:
It begins with htmx

---

![[htmx-site.png]]

notes:
htmx has been gaining a lot of popularity recently and for good reason. 

---

![[js-catch.png]]

notes:
it provides a sensible alternative to the now most common way of building web apps, a javascript-heavy single page application that gets data by consuming json based apis and then has to handling all the parsing and rendering logic on the client.

---
![[just-use-html.png]]
notes:
htmx says theres another way. 

---
JSON:
<!-- ```json
{
  "name": "Pikachu",
  "type": "Electric",
  "level": 25
}
``` -->
<pre>
<code class="language-json" style="line-height:1.4em">
{
  "name": "Pikachu",
  "type": "Electric",
  "level": 25
}
</code></pre>

Hypermedia:
<!-- ```html
<ul>
	<li>Name: Pikachu</li>
	<li>Type: Electric</li>
	<li>Level: 25</li>
</ul>
``` -->
<pre>
<code class="language-html" style="line-height:1.4em">&lt;ul&gt;
	&lt;li&gt;Name: Pikachu&lt;/li&gt;
	&lt;li&gt;Type: Electric&lt;/li&gt;
	&lt;li&gt;Level: 25&lt;/li&gt;
&lt;/ul&gt;</code></pre>
notes:

Htmx is based around the concept of hypermedia responses. Put simply, this means instead of returning json, your endpoints return html. 

---
GET htmx.org returns:

![[Pasted image 20230717150239.png|600]]
notes:
Most websites technically do this already, but on a full page level. 

---
The only way to send GET requests in raw HTML

<!-- ```html
<a href="/user">user page</a>
``` -->
<pre>
<code class="language-html">&lt;a href="/user"&gt;user page&lt;/a&gt;</code></pre>

notes:
This is mainly a limitation of traditional html which only allows `anchor` and `form` tags to submit http requests and forces the whole page to change with their response.

---
![[Pasted image 20230717150433.png]]

notes:

htmx is different in that it allows any element to make http requests and then enables you to choose exactly where in the dom to put the returned html and whether or not to replace what was their before.

---
<!-- ```html
<div hx-trigger="done" hx-get="/job" hx-swap="outerHTML">
  <h3 role="status" id="pblabel" tabindex="-1" autofocus>Running</h3>
  <div
    hx-get="/job/progress"
    hx-trigger="every 600ms"
    hx-target="this"
    hx-swap="innerHTML">
    <div class="progress" role="progressbar">
      <div id="pb" class="progress-bar" style="width:0%">
    </div>
  </div>
</div>
``` -->
<pre>
<code class="language-html">&lt;div hx-trigger="done" hx-get="/job" hx-swap="outerHTML"&gt;
  &lt;h3 role="status" id="pblabel" tabindex="-1" autofocus&gt;Running&lt;/h3&gt;
  &lt;div
    hx-get="/job/progress"
    hx-trigger="every 600ms"
    hx-target="this"
    hx-swap="innerHTML"&gt;
    &lt;div class="progress" role="progressbar"&gt;
      &lt;div id="pb" class="progress-bar" style="width:0%"&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

notes:
all of this is done with a declarative html embedded syntax instead of traditional scripting

---
Example Time!

notes:
that was a lot so lets take a look at a quick example.

---
starting html
<!-- ```html
<body>
	<button hx-post="/clicked" hx-swap="outerHTML">
	    Click Me
	</button>
</body>
``` -->
<pre>
<code class="language-html">&lt;body&gt;
	&lt;button hx-post="/clicked" hx-swap="outerHTML"&gt;
	    Click Me
	&lt;/button&gt;
&lt;/body&gt;</code></pre>

server
<!-- ```ts 
app.post('/clicked', (req, res) => {
  res.send("<div>I'm from the server</div>")
})
``` -->
<pre>
<code class="language-ts">app.post('/clicked', (req, res) => {
  res.send("&lt;div&gt;I'm from the server&lt;/div&gt;")
})</code></pre>
notes:

on the top is the html that our client will start with. the body contains a single item, a button with two attributes. The first is "hx-post=/clicked", this tells htmx that when the element is triggered (which is on click by default for buttons) to send a http post request to /clicked. The next attribute "hx-swap" tells htmx what to do with the html response from that request. here "outerHTML" means to replace entire element

on the bottom represents our server, it simply returns a html string when responding to a post request to /clicked

---

video demostration

notes:
now with the code running we can see that when we click the button, it is replaced by the div returned from the server, pretty cool!

---

![[Pasted image 20230717153558.png]]

notes:

this is just the tip of the iceberg of what's cool about htmx and all the tools it offers,
it can do loading states, web sockets, infinite scroll, css transitions, client side routing, and so much more

---

![[Pasted image 20230717153619.png]]

notes:
im going to move on for now, but definitely check out the htmx docs and essays AFTER you finish this video

---
python:

<!-- ```python
import json
json_data = json.dumps(dictionary)
dictionary = json.loads(json_data)
``` -->
<pre>
<code class="language-python">import json
json_data = json.dumps(dictionary)
dictionary = json.loads(json_data)</code></pre>

ruby:

<!-- ```ruby
require 'json'
json_data = hash.to_json
hash = JSON.parse(json_data)
``` -->
<pre>
<code class="language-ruby">require 'json'
json_data = hash.to_json
hash = JSON.parse(json_data)</code></pre>

notes:
because json is so ubiquitous and doesn't contain any additional information other than the raw data, nearly every language has very strong support for serialization and deserialization 

---
![[Pasted image 20230717154120.png]]
notes:
however now that we are working with html, things can be a bit tricker
our code has data, but html has ui embedded with data. we need a good way to combine the two thats better than raw string concatenation

---
<!-- ```c#
public string ReturnUserHtml(string name, int age)
{
    return $@"
        <div>
		    <h1>Hello, {name}!</h1>
		    <p>You are {age} years old.</p>
	    </div>";
}
``` -->
<pre>
<code class="language-csharp">public string ReturnUserHtml(string name, int age)
{
    return $@"
        &lt;div&gt;
		    &lt;h1&gt;Hello, {name}!&lt;/h1&gt;
		    &lt;p&gt;You are {age} years old.&lt;/p&gt;
	    &lt;/div&gt;";
}</code></pre>

you can't (shouldn't) write large apps like this

notes:
and an additional challenge when working with html is the need for syntax highlighting, formatting, and general editor interop, 
without these writing html becomes not fun very quick

---

### Templating!

notes:
enter templating. most languages have standard templating libraries:

---

![[Pasted image 20230717155111.png]]

notes:
php has blade & twig

---
![[Pasted image 20230717155157.png]]
notes:
python has jinja and django

---
![[Pasted image 20230717155334.png]]
notes:
ruby has erb
and so on

although personally as someone coming from a frontend background im a bit put off by all of these, although I promise its for fair reasons.

---
<split gap="1">
![[Pasted image 20230717160343.png|450]]
![[Pasted image 20230717160351.png|400]]
</split>

notes:
all of these templating languages involve the template being in a completely separate file from your actual code with the data to be used. This means you have to constantly go back and forth between these two files, as losing any typesafety you had

---

components are pretty nice

notes:
also, not all of them support components, something as a frontend dev I would consider basically a necessity. The ability to split up your ui into reusable pieces is just so important for a good developer experience

---

`app/View/Components/MyComponent.php`
<!-- ```php
namespace App\View\Components;
use Illuminate\View\Component;
class MyComponent extends Component
{
    public $text;
    public function __construct($text)
    {
        $this->text = $text;
    }
    public function render()
    {
        return view('components.mycomponent');
    }
}
``` -->
<pre>
<code class="language-php" style="line-height: 1.1em; font-size:.75em">namespace App\View\Components;
use Illuminate\View\Component;
class MyComponent extends Component
{
    public $text;
    public function __construct($text)
    {
        $this->text = $text;
    }
    public function render()
    {
        return view('components.mycomponent');
    }
}</code></pre>

`resources/views/components/mycomponent.blade.php`
<!-- ```html
<div>
    {{ $text }}
</div>
``` -->
<pre>
<code class="language-html" style="line-height: 1.1em; font-size:.75em">&lt;div&gt;
    {{ $text }}
&lt;/div&gt;</code></pre>


notes:
Additionally the ones that do support components are often based around the idea of a single-file-component, meaning every component no matter how small or simple must be in its own file

---

wait im a react dev

notes:
but wait who am I kidding im a frontend dev
isnt jsx basically a templating language, and now that I think about it, its actually a pretty good one at that. 

---

![[Pasted image 20230717181602.png]]

notes:
first of all, there’s so much supporting tooling for it due to its popularity: typescript types for html attributes, and tons of supporting syntax highlighting, formatting, and autocomplete tools.


---
<!-- ```tsx
function Component(props) {
	// logic (optional)
	return (
		// jsx (html + javascript)
	)
}
``` -->
<pre>
<code class="language-tsx">function Component(props) {
	// logic (optional)
	return (
		// jsx (html + javascript)
	)
}</code></pre>



notes:
second, a functional jsx component has a really great mental model
a component is dead simple, a function that takes some properties as argument, maybe does some logic, and returns a ui

---
<!-- ```tsx
function User({ name, age }) {
  const [firstName, lastName] = name.split(" ");
  return (
    <div>
      <h1>Hello, {firstName}!</h1>
      <p>You are {age} years old.</p>
      <p>Your last name has {lastName.length} letters.</p>
    </div>
  );
}
``` -->
<pre>
<code class="language-tsx">function User({ name, age }) {
  const [firstName, lastName] = name.split(&quot; &quot;);
  return (
    &lt;div&gt;
      &lt;h1&gt;Hello, {firstName}!&lt;/h1&gt;
      &lt;p&gt;You are {age} years old.&lt;/p&gt;
      &lt;p&gt;Your last name has {lastName.length} letters.&lt;/p&gt;
    &lt;/div&gt;
  );
}</code></pre>



notes:
and finally the actual templating is really clean, curly braces escape you into javascript land where you can do whatever logic you want right in your template as long as it evaluates to a valid result

---

please not javascript

notes:
but remember our goal here is to write html strings, not javascript

---
<!-- ```tsx
import { renderToString } from 'react-dom/server';  

app.post('/clicked', (req, res) => {
  res.send(renderToString(<MyDiv />))
})

function MyDiv() {
	return <div>I'm from the server</div>;
}
``` -->
<pre>
<code class="language-typescript">import { renderToString } from 'react-dom/server';  

app.post('/clicked', (req, res) =&gt; {
  res.send(renderToString(&lt;MyDiv /&gt;))
})

function MyDiv() {
	return &lt;div&gt;I&apos;m from the server&lt;/div&gt;;
}</code></pre>


notes:
technically we could use react and renderToString, but this is pretty stupid for many reasons im not going to go into

what if there was a way to get the developer experience of jsx, but with the output as a raw html string right from the start?

---
this:
<!-- ```tsx
<ol start={2}>{[1, 2].map(i => <li>{i}</li>)}</ol>
``` -->
<pre>
<code class="language-tsx" style="line-height: 1.2em">&lt;ol start={2}&gt;{[1, 2].map(i =&gt; &lt;li&gt;{i}&lt;/li&gt;)}&lt;/ol&gt;</code></pre>


compiles to:
<!-- ```ts
elements.createElement("ol", { start: 2 }, [1, 2].map(function (li) { 
    return elements.createElement("li", null, li); 
}));
``` -->
<pre>
<code class="language-typescript" style="line-height: 1.2em">elements.createElement("ol", { start: 2 }, [1, 2].map(function (li) { 
    return elements.createElement("li", null, li); 
}));</code></pre>


which evaluates to:
<!-- ```ts
"<ol start="2"><li>1</li><li>2</li></ol>"
``` -->
<pre>
<code class="language-typescript" style="line-height: 1.2em">&quot;&lt;ol start=&quot;2&quot;&gt;&lt;li&gt;1&lt;/li&gt;&lt;li&gt;2&lt;/li&gt;&lt;/ol&gt;&quot;</code></pre>

notes:
it turns out there is, with this amazing library called `typed-html`

typed-html allows us to write fully typesafe jsx with functional components, but that output directly as an html string, perfect

---

✅ HTMX 

notes:
lets recap
So far we have htmx, our client framework that will power all of the hypermedia requests and dom manipulation, 

---

✅ HTMX \
✅ JSX for templating

notes:
and typed-html and jsx providing an easy way to write the html to return from our server

---

✅ HTMX \
✅ JSX for templating \
❓ Server Framework
notes:
but, what actually is our server?

---
<split gap="1">
![[Pasted image 20230717220831.png|400]] ![[Pasted image 20230717221004.png]]
</split>

notes:
well using jsx that means were locked into typescript, so we could use express or nest- im just kidding we are way past those

---

![[Pasted image 20230717221512.png]]

notes:
Bun is a all in one javascript runtime and toolkit designed for speed

---
![[Pasted image 20230717221552.png]]
notes:
think of it as node, pnpm, esbuild and vitest in one, but multiple times faster than all of them

check out the bun benchmarks after this video they will blow your mind

---
![[Pasted image 20230717221913.png]]

notes:
bun plans to release their 1.0 version in a couple months, although what they have now is still really exciting. 

---
![[Pasted image 20230717222049.png]]
notes:
I was really impressed with how much bun provides and just how fast everything was. Its currently only available on linux, 

---
![[Pasted image 20230718001300.png]]

notes:
but with windows subsystem for linux I was able to get it installed pretty easily

---

![[Pasted image 20230718001529.png]]

notes:
elysia is one of bun's fastest web frameworks which caught my eye for its commitment to end-to-end type safety, while keeping a familiar express like syntax

---

![[Pasted image 20230718003126.png]]

notes:
it has all the stuff you would expect from a web framework plus, input validation, a fully typesafe fetch client, remote procedure calls, dependency injection, 

---
![[Pasted image 20230718003110.png]]

notes:
automatic swagger generation, and so much more.

---

![[Pasted image 20230718002541.png]]

notes:
as well as being multiple times faster than even the best node offerings

elysia is awesome and its a great pick to be the server framework for our stack

---

lets get building

notes:
ok now we have our tools, lets get building
were going to make a simple todo list, I know its unoriginal but its an easy way to demonstrate basic CRUD operations

---
```
mkdir beth-stack
cd beth-stack
```

notes:
after installing bun well start by creating a new directory

---

```
$ bun init
bun init helps you get started with a minimal project and tries to
guess sensible defaults. Press ^C anytime to quit.

package name (beth-stack):
entry point (index.ts):

Done! A package.json file was saved in the current directory.
 + index.ts
 + .gitignore
 + tsconfig.json (for editor auto-complete)
 + README.md

To get started, run:
  bun run index.ts
```

notes:
and running `bun init` to scaffold our project

---

```
$ bun add elysia
bun add v0.6.14 (b5665739)

 installed elysia@0.5.22


 9 packages installed [1007.00ms]
```

notes:
now we can add elysia with `bun add`

---

```ts
import { Elysia } from "elysia";

const app = new Elysia().get("/", () => "Hello World!").listen(3000);
console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
```

notes:
in `index.ts` well start by creating our Elysia server

---
`bun run index.ts`

notes:
we can use `bun run` to launch our app

---
![[Pasted image 20230718013450.png]]

notes:
looks like everything seems to be working, so lets move on

---

`bun run --watch index.ts`

notes:
also from now on you can use the watch flag to automatically restart your app on changes

---

```ts
const baseHtml = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BETH STACK</title>
</head>
<body>html!</body>
`
```

notes:
well need some base html to serve as the shell for our app, which ill define just as a variable for now
this is pretty basic, just some meta tags and a body

now lets setup up elysia to serve this on the index route

---
![[Pasted image 20230718015031.png]]
notes:
Elysia has an HTML plugin that adds the necessary headers to the response, allowing the browser to interpret it as a valid HTML document for rendering on the screen.

---

```
$ bun add @elysiajs/html
bun add v0.6.14 (b5665739)

 installed @elysiajs/html@0.5.2


 1 packages installed [714.00ms]
```

notes:
we can add it with `bun add`

---

```ts
import { html } from "@elysiajs/html";

const app = new Elysia()
  .use(html())
  .get("/", ({ html }) => html(baseHtml))
  .listen(3000);
```

notes:
now we import html and apply the plugin to our app with the use method
giving us access to the html function in our handlers, which we can use to wrap the base html variable

---

![[Pasted image 20230718015900.png]]

notes:
great now we have our base html rendering correctly
we wont need this `html` helper from now on, even though our other endpoints will return html, its actually ok that they are just interpreted as plain text, htmx will handle all of the interaction with the dom.

---
```
bun add -d typed-html
```
in tsconfig:
```json
{
    "compilerOptions": {
        "jsx": "react",
        "jsxFactory": "elements.createElement",
    }
}
```

notes:
now its time to bring in jsx
lets install typed-html as a dev dependency, and adjust our tsconfig as described in the docs

---
```ts
// index.tsx
import * as elements from 'typed-html';
```

notes:
now change index.ts to index.tsx
and import `typed-html`

---

```ts
const BaseHtml = ({ children }: elements.Children) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BETH STACK</title>
</head>

${children}
`;
```

notes:
our first change will be to make our basehtml variable a component
to do this we will turn it into a function that takes a children prop, and places it after the head of our document.

---

```tsx
const app = new Elysia()
  .use(html())
  .get("/", ({ html }) =>
    html(
      <BaseHtml>
        <body>
          <h1>Hello World</h1>
        </body>
      </BaseHtml>
    )
  )
```

notes:
now lets update our route handler to use this component

whatever we pass as children will appear in the starting html when loading the index route

---

![[Pasted image 20230718022318.png]]

notes:
all looks good, so time to bring in htmx

---

```html
<script src="https://unpkg.com/htmx.org@1.9.3"></script>
```

notes:
adding htmx is as easy as dropping a script tag in the head of our BaseHtml


---

![[Pasted image 20230718022719.png]]
notes:
its worth mentioning quickly that if your using vscode, theres a htmx-tags extension that adds types for the htmx attributes (although it seems to only kind of work with jsx)

---
```tsx
.get("/", ({ html }) =>
    html(
      <BaseHtml>
        <body>
          <button hx-post="/clicked" hx-swap="outerHTML">
            Click Me
          </button>
        </body>
      </BaseHtml>
    )
  )
```


notes:
now lets recreate the basic example from the very start of the video, well start by adding the initial button to the body in the starting html

---

```tsx
.post("/clicked", () => <div>I'm from the server!</div>)
```

notes:
then well create the /clicked post endpoint
which will simply return a div with some text

---

(video of browser)

notes:
back in the browser, when we click the button htmx is sending the post request and swapping in the response just as we expect

---

endpoints return html AND their styles

notes:
it would be nice if this button was in the middle of the screen, but I would really prefer to not use vanilla css

---
![[Pasted image 20230718023917.png]]
notes:
we could use tailwind, but tailwind requires postcss and a build step, or so I thought

---
![[Pasted image 20230718025251.png]]
notes:
turns out tailwind just works with a single script tag, pretty convenient

---
```html
<script src="https://cdn.tailwindcss.com"></script>
```

notes:
lets add it to our base html head

tailwind is amazing for many reasons, but its inline format actually fits perfectly with the htmx model, so our hypermedia responses can ship with their styles as well

---

```
$ touch tailwind.config.js
```

notes:
its also worth noting if your using the vscode tailwind intellisense extension it requires a `tailwind.config.js` file present in your project to be enabled, although its fine to leave it empty as our app wont use it

---
```tsx
  .get("/", ({ html }) =>
    html(
      <BaseHtml>
        <body class="flex w-full h-screen justify-center items-center">
          <button hx-post="/clicked" hx-swap="outerHTML">
            Click Me
          </button>
        </body>
      </BaseHtml>
    )
  )
  .post("/clicked", () => <div class="text-blue-600">I'm from the server!</div>)
```


notes:
lets add some tailwind classes to our html

---

(show browser)

notes:
and look at that, our styles work great

---

todo list time!

notes:
now lets start actually building our todo list

---
```ts
type Todo = { 
	id: number,
	content: string,
	completed: boolean
}

const db: Todo[] = [ 
	{ id: 1, content: 'learn the beth stack', completed: true }, 
	{ id: 2, content: 'learn vim', completed: false }
]
```

notes:
in our app a todo will have a unique id, some text content, and whether or not its completed

for now well represent our db as a in memory array for simplicity
ive seeded the database with 2 entries to give us some data to work with

---

```tsx
function TodoItem({ content, completed, id }: Todo) {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input type="checkbox" checked={completed} />
      <button class="text-red-500">X</button>
    </div>
  );
}
```

notes:
now lets create a todo item component to render a todo
it will take the contents of a todo as props and show the content in a p element, have a checkbox for the completed status and a button to delete

---
```tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div>
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
    </div>
  );
}
```


notes:
now our todo list component
it will take an array of todos as props and map over it creating a todo item for each todo

---

```tsx
.get("/todos", () => <TodoList todos={db} />)
```

notes:
next lets set up a new endpoint /todos which will return the html of the rendered todo list
to do this we simply return the todo list component with our db as the todos prop

---

(show browser)

notes:
checking out the /todos route and theres the hypermedia in action, our todo list as html
now lets load this into our main page

---

```html
<body
  class="flex w-full h-screen justify-center items-center"
  hx-get="/todos"
  hx-trigger="load"
  hx-swap="innerHTML"
/>
```

notes:
we could put this behind a button click like before, but instead lets have the body element fetch the data immediately on load with hx-trigger load, and place the contents inside itself with hx-swap innerHTML

---

(show browser)

notes:
and if we check the index route our todos are there as we expect

---
Create, Read, Update, Delete
notes:
now lets focus on adding CRUD functionality

---
```tsx
.post(
    "/todos/toggle/:id",
    ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id);
      if (todo) {
        todo.completed = !todo.completed;
        return <TodoItem {...todo} />;
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
```

notes:
well start with being able to toggle whether a todo is complete
first well create a new post handler for /todos/toggle/id
on request well get the that todo from the database, toggle its completed status and return a TodoItem component for that todo, for our client to swap in place of the old one

note the additional argument in the post function, this defines the input validation for the route params using the `t` object is imported from elysia,
t.numeric automatically attempts coerces any string to a number

---
```tsx
function TodoItem({ content, completed, id }: Todo) {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input
        type="checkbox"
        checked={completed}
        hx-post={`/todos/toggle/${id}`}
        hx-swap="outerHTML"
        hx-target="closest div"
      />
      <button class="text-red-500">X</button>
    </div>
  );
}
```
notes:
now lets modify our todo item component

to start add the the hx-post attribute using the id prop, this will send the post request to the right endpoint for each todo's id whether the input is toggled

but we want to swap the entire component with the response, not just the input element
to do this we need to change the htmx target, and we can do this with the hx-target attribute

although hx-target supports css selectors to target elements anywhere in the dom, here we can just use closest div to grab the entire component

the final step is to set hx-swap to outerHTML to completely replace the existing element

---

(show browser)

notes:
and look at that, now we can toggle a todo and its new state remains even when we reload the page

next, deleting a todo

---

```ts
.delete(
    "/todos/:id",
    async ({ params }) => {
      const todo = db.find((todo) => todo.id === params.id);
      if (todo) {
        db.splice(db.indexOf(todo), 1);
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
```

notes:
the process is very similar to what we just did, well create a new delete endpoint, and in our handler remove that todo from the database

---

```tsx
function TodoItem({ content, completed, id }: Todo) {
  return (
    <div class="flex flex-row space-x-3">
      <p>{content}</p>
      <input
        type="checkbox"
        checked={completed}
        hx-post={`/todos/toggle/${id}`}
        hx-swap="outerHTML"
        hx-target="closest div"
      />
      <button
        class="text-red-500"
        hx-delete={`/todos/${id}`}
        hx-swap="outerHTML"
        hx-target="closest div"
      >
        X
      </button>
    </div>
  );
}
```

notes:
now we can update our delete button again very similar to before, notice we're still swapping the parent div outerHTML with the response from the request. 

---
![[Pasted image 20230718040454.png]]

notes:
hx-swap does have a 'delete' value, but it deletes regardless of the response, we want it to only delete if the server deleted successfully. 

---
![[Pasted image 20230718042231.png]]
notes:
The delete endpoint doesnt return anything so swapping the parent div with nothing is basically the same as deleting, but this ensures this only happens if the request completes successfully.

---

(show browser)

notes:
and success!, deletion that remains if you reload

now the final part of CRUD, creating new todos

---
```tsx
  .post(
    "/todos",
    ({ body }) => {
      if (body.content.length === 0) {
        throw new Error("Content cannot be empty");
      }
      const newTodo = {
        id: lastID++,
        content: body.content,
        completed: false,
      };
      db.push(newTodo);
      return <TodoItem {...newTodo} />;
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
```

notes:
this time create a post endpoint to /todos
again note the elysia input validation

first we make sure the input isnt an empty string, then, insert into the database, finally return a new todo item component
to ensure no overlapping ids, I created a variable to increment on each call

---

```tsx
function TodoForm() {
  return (
    <form
      class="flex flex-row space-x-3"
    >
      <input type="text" name="content" class="border border-black" />
      <button type="submit">Add</button>
    </form>
  );
}
```

notes:
now lets create out todo form component

it has one text input with the name content to match what our server expects and a submit button

---

```tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div>
      {todos.map((todo) => (
        <TodoItem {...todo} />
      ))}
      <TodoForm />
    </div>
  );
}
```

notes:
we can add this right below our list of todos in the todo list component

---
```tsx
function TodoForm() {
  return (
    <form
      class="flex flex-row space-x-3"
      hx-post="/todos"
      hx-swap="beforebegin"
    >
      <input type="text" name="content" class="border border-black" />
      <button type="submit">Add</button>
    </form>
  );
}
```
notes:
back in the form we can add the hx-post attribute to the /todos endpoint
this request returns the new todo, which we will want to place that at the end of the set of existing todos
to do this we add the hx-swap beforebegin attribute, this places the new todo before the form, exactly where we want it to be

---

show browser

notes:
and there we go, full CRUD functionality complete!

---

an in memory array isnt a 'real' db

notes:
the only problem now is that our db gets wiped back to its default state whenever we rerun our app, to make it a real application we'll want to persist our data to an actual database

---

`bun:sqlite`

notes:
bun does provide its own sqlite driver, which although it is technically supported, 

---

![[Screenshot 2023-07-18 044156.png]]
notes:
I couldnt get working with my orm of choice these days drizzle

---

![[Pasted image 20230718044350.png]]

notes:
but thats ok because the the BETH stack uses turso
turso is serverless sqlite on steroids and supports creating distributed replica databases at the edge all over the world
it works perfect with drizzle and also has a very generous free tier to get started

---

```
$ turso db create my-db
```

notes:
after installing the turso cli and signing in make a database with turso db create

---

```
$ turso db show my-db
```

notes:
next get the database url with turso db show

---

```
$ turso db tokens create my-db
```

notes:
finally create a new authentication token for your database with turso db tokens create

---

```
$ touch .env
```

```
DATABASE_URL=""
DATABASE_AUTH_TOKEN=""
```

notes:

back in our project create a .env file and add your database credentials

---

```
$ mkdir src
$ mv index.tsx src/index.tsx
```

notes:
were about to add a separate database folder, so to keep things organized im moving our index.tsx file to a source directory

---

```
$ mkdir src/db
$ touch src/db/schema.ts
```

notes:
well start by defining our database schema in a schema.ts file

---
```bash
$ bun add drizzle-orm @libsql/client
$ bun add -d drizzle-kit 
```
notes:
almost forgot, well need to add drizzle, drizzlekit and the libsql client

---

```ts
import { InferModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

export type Todo = InferModel<typeof todos>;
```

notes:
our database schema is very simple, a single todos table with the same 3 fields we had before

id is our primary key of type integer. im enabling auto increment so we dont have to worry about generating new ids

content is a not null text field, pretty simple

for the completed column, sqlite doesnt support booleans, but you can accomplish the same thing with either a 0 or 1 in a interger column, drizzle can emulate this with mode: boolean, and additionally ive set the default to false as a todo always starts un completed.

finally we create a new Todo type inferred from our table schema

---

```
$ touch drizzle.config.ts
```
```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  driver: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

notes:
now well need to create a drizzle config file to tell drizzle where our schema lives, the database driver we are using, and how to access the database

enabling verbose and strict just keeps us a bit more informed of what drizzle is doing

---

```
$ bunx drizzle-kit push:sqlite
```

notes:
now we can use drizzle-kit push to push our typescript schema to our actual database

---

```
$ bunx drizzle-kit studio
```

notes:
if we run drizzle studio we should see the todos table created, but empty
thats perfect for now

---
```json
"scripts": {
    "db:push": "bunx drizzle-kit push:sqlite",
    "db:studio": "bunx drizzle-kit studio"
}
```
notes:
for convenience, you might want to add these two commands as scripts in your package.json

---

actually use the database!

notes:
finally its time to actually create the database client and replace our old fake one

---

```
$ touch src/db/index.ts
```
```ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema, logger: true });
```

notes:
in a new index file in the db directory create the drizzle client
enabling the logger lets use see a bit more clearly what queries are being run

now we can start modifying our server code

---

(show deletion)
```ts
import { db } from "./db";
import { Todo, todos } from "./db/schema";
```

notes:
well start by deleting our old "database" and todo type
then well import our new database, todos table and Todo type

---
```ts
.get("/todos", async () => {
    const data = await db.select().from(todos).all();
    return <TodoList todos={data} />;
  })
```


notes:
lets start with our get handler for /todos
we select all rows from the todos table, and pass the data to the todo list component
easy enough

---

```ts
.post(
    "/todos/toggle/:id",
    async ({ params }) => {
      const oldTodo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .get();
      const newTodo = await db
        .update(todos)
        .set({ completed: !oldTodo.completed })
        .where(eq(todos.id, params.id))
        .returning()
        .get();
      return <TodoItem {...newTodo} />;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
```

notes:
now the toggle endpoint
first, we get the todo based off the passed id, then update that todo with the opposite of the old todo's completion status and finally return a todo item with the updated todo data

---

```ts
.delete(
    "/todos/:id",
    async ({ params }) => {
      await db.delete(todos).where(eq(todos.id, params.id)).run();
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
```

notes:
next, our delete handler
this one is simple, just delete the row in todos where the id is the passed id

---
```ts
.post(
    "/todos",
    async ({ body }) => {
      if (body.content.length === 0) {
        throw new Error("Content cannot be empty");
      }
      const newTodo = await db.insert(todos).values(body).returning().get();
      return <TodoItem {...newTodo} />;
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
```

notes:
finally our create new todo handler

like before we check to make sure the input isnt empty then create the new row and return the new todo item

---

browser

notes:
and thats it, if we check the browser everything works just as before
but now on a remote sqlite database, awesome!

---

one small thing

notes:
one thing that is kind of annoying is that the text input of our form doesnt reset when we submit the form

---

> "While htmx encourages a hypermedia-based approach to building web applications, **it does not preclude scripting** and offers a few mechanisms for integrating scripting into your web application."

notes:
to solve this we are going to need to do some client scripting

---
> "Code-On-Demand (i.e. scripting) should, as much as is practical, be done _directly in_ the primary hypermedia"

notes:
but dont worry, htmx actually completely endorses the use of minimal scripting for the places its required, 
so not *everything* has to be done 100% over http

although they make it clear any scripting done should be inline in your html

---

<pre> <code class="language-html" style="font-size:.9em; line-height: 1.2em"><!-- hyperscript -->
<button _="on click toggle .red-border">
  Toggle Class
</button>

<!-- Alpine JS -->
<button @click="open = !open" :class="{'red-border' : open, '' : !open}">
  Toggle Class
</button>

<!-- VanillaJS -->
<button onclick="this.classList.toggle('red-border')">
  Toggle Class
</button>
</code></pre>

%%notes:
just like inline styles with tailwind, inline scripting fits perfect with our component and hypermedia model

there are multiple inline scripting libraries out there such as alpine js or even vanilla js,

but the creators of htmx have also made a companion library called hyperscript, a easy to use yet powerful inline scripting language which I am deciding to use for our stack%%

---

```html
<script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
```

notes:
to add hyperscript to our app we simply drop the script tag in our base html

---
![[Pasted image 20230718054354.png]]
notes:
quick note about types
hyperscript has a vscode extension but it only supports html not jsx

---

```
$ touch types.d.ts
```

```ts
declare namespace JSX {
  interface HtmlTag {
    _?: string;
  }
}
```

notes:

so well need to create a .d.ts file in your project and add the underscore attribute that hyperscript uses to the Htmltag interface in the JSX namespace

---

scripting!

notes:
now were all set to add scripting to our form

---

```tsx
function TodoForm() {
  return (
    <form
      class="flex flex-row space-x-3"
      hx-post="/todos"
      hx-swap="beforebegin"
      _="on submit target.reset()"
    >
      <input type="text" name="content" class="border border-black" />
      <button type="submit">Add</button>
    </form>
  );
}
```

notes:
this part is actually really easy, the reset method on the form object resets all its fields
so using the target keyword, which by default is set the element running the script, we call reset on submit

---

show browser

notes:
and hey look at that, works perfectly

---

deploy time!

notes:
our app is complete so now its time to deploy
the BETH stack can deploy anywhere that supports docker

---

![[Pasted image 20230718055405.png]]

notes:
but by far the most convenient way is with fly.io

---


```json
"type": "module",
"module": "src/index.tsx",
```

notes:
one quick note before we deploy,
make sure the module entry point in package.json correctly matches the entry point for your app as we've moved and renamed this file a couple times

---

```
$ fly launch
```

notes:
after installing the fly cli and logging in
start with fly launch
choose and name and a location and fly will generate the files needed for your deployment

---

```
$ fly secrets set DATABASE_URL=your_url
$ fly secrets set DATABASE_AUTH_TOKEN=your_token
```

notes:
now add your environment variables

---

```
$ fly deploy
```

notes:
and with that you can run fly deploy and in a minute or two your app will be live! yay!

---

![[Pasted image 20230718060715.png]]

the edge baby

notes:
something cool about turso, is that it itself runs on fly
this means that when you deploy your app to one or multiple of fly's 34 regions, you can also put a companion database in the exact same datacenter for some really amazing performance

---
# The BETH Stack
An opinionated hypermedia-driven web framework
notes:
And there you have the BETH stack.
I actually quite enjoyed writing this simple todo app.
I think this stack brings a really strong combination of performance and developer experience to the hypermedia-driven application architecture set forth by htmx.

---

## The BEST Stack?

notes:
It might not be the BEST stack, but it is the BETH stack.

---

light outro

notes:
Now is a great time to go check out all the cool things I told you to hold out on. Each part of this stack Bun, Elysia, Turso and HTMX all are amazing and worth your time to give their respective websites a visit and read up on all their cool features I didn't mention.

---
![[Pasted image 20230718061227.png]]
notes:
If your interested in seeing the source code to the todo list app in this video there will be a link to the github repo for it with a different branch for each step along the way,

---
![[Pasted image 20230718061146.png]]
notes:
as well as a link to the live deployed site in the description.

---

<!-- ```ts
console.log("till next time")
``` -->
<pre>
<code class="language-ts">console.log("till next time")
</code></pre>

notes:
If you enjoyed this video consider subscribing.

As always, the transcript and markdown source code are available on my github, link in the description, and any corrections will be in the pinned comment.

Thank you for watching, and I'll see you in the next video.