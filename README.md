# Muh

Muh (say: Moo!) stands for "mustached hypertext" and is the template language that runs [Sissi](https://sissi.js.org), the static site generator. It is put into a single package so it can be re-used in other projects as well.

## Syntax

The syntax is `{{ moo }}` where `moo` can be any arbitrary JavaScript. JavaScript is evaluated in a safe context. The only globals it can access are the ones you provide, plus a few built-ins.

When the evaluated expression is a promise, it is automatically resolved (or rejected). When the evaluated expression is a function, it is automatically invoked without parameters.

Under the hood, it uses `node:vm`, which makes it a node-only library (for now). It should work in Deno 2, as it provides some backwards-compatibility to node.js.

## Filters

You can apply filters to your mustache expressions using the pipe notation. There are a few built-in filters:

```js
{{ content | safe }} // dont escape html
{{ promise | async }} // resolve promises
{{ result | json }} // print json
{{ article.date | date: 'de' }} // 25.12.2024 (for first Christmas Day 2024)
{{ price | currency: 'de', 'euro' }}  // 1.234,56 €
{{ fetchJson('/api/articles') | async | limit: 5 | each: templateFunction }} 
{{ include('article.html', {title: 'Article Title'}) | safe }}
{{ '<' | htmlentities }} // &lt;
{{ ' ' | urlencode }} // %20
```

## Helpers

There are a few built-in helper functions:

```js
{{ fetchJson('https://yesno.wtf/api') | async | json }}
{{ fetchText('https://some-html.api/api/weather') | async }}

{{ include('_includes/partial.html', {title: 'some additional data'}) }} /* TODO */
```

## Usage

```js
const result = await processTemplateFile(
  '<h1>{{ title }}</h1>',
  'index.html', 
  {title: 'Test'}
);

console.log(result) // <h1>Test</h1>
```
