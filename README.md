[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]

<div align="center">
  <a href="https://github.com/posthtml/posthtml">
    <img width="200" height="200" alt="PostHTML"
      src="http://posthtml.github.io/posthtml/logo.svg">
  </a>
  <h1>PostHTML Parser</h1>
  <p>Parses HTML to PostHTML Tree</p>
</div>

<h2 align="center">Install</h2>

```bash
npm i -D posthtml-parser
```

<h2 align="center">Usage</h2>

```js
const parser = require('posthtml-parser')

const options = {}

const tree = parser(options)(html)
```

### `AST Format`

Any parser being used with PostHTML should return a standard PostHTML [Abstract Syntax Tree](https://www.wikiwand.com/en/Abstract_syntax_tree) (AST). Fortunately, this is a very easy format to produce and understand. The AST is an array that can contain strings and objects. Any strings represent plain text content to be written to the output. Any objects represent HTML tags.

Tag objects generally look something like this:

#### `Tag {Object}`

```js
{
  tag: 'div',
  attrs: {
    class: 'name'
  },
  content: [ 'Hello World!' ]
}
```

#### `Text (Content) {String}`

```js
'Hello World!'
```

Tag objects can contain three keys. The `tag` key takes the name of the tag as the value. This can include custom tags. The optional `attrs` key takes an object with key/value pairs representing the attributes of the html tag. A boolean attribute has an empty string as its value. Finally, the optional `content` key takes an array as its value, which is a PostHTML AST. In this manner, the AST is a tree that should be walked recursively.

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**[`tags`](#tags)**|`{Array}`|`[ import, include ]`|Specify custom self closing tags|
|**[`directives`](#directives)**|`{Array}`|`[ doctype, ?php ]`|Specify custom directives|

### `tags`

```js
const parser = require('posthtml-parser')

const tags = [ 'import' ]

const tree = parser({ tags })(html)
```

### `directives`

```js
const parser = require('posthtml-parser')

const directives = [
  { name: '?', start: '<', end: '>' }
]

const tree = parser({ directives })(html)
```

<h2 align="center">Examples</h2>

**file.html**
```html
<a class="animals" href="#">
    <span class="animals__cat" style="background: url(cat.png)">Cat</span>
</a>
```

```js
const parser = require('posthtml-parser')

const html = `
<a class="animals" href="#">
  <span class="animals__cat" style="background: url(cat.png)">Cat</span>
</a>
`
const options = {}

const tree = parser(options)(html)
```

```js
[
  {
    tag: 'a',
    attrs: {
      class: 'animals',
      href: '#'
    },
    content: [
      '\n    ',
      {
        tag: 'span',
        attrs: {
          class: 'animals__cat',
          style: 'background: url(cat.png)'
        },
        content: [ 'Cat' ]
      },
      '\n'
    ]
  }
]
```


[npm]: https://img.shields.io/npm/v/posthtml-parser.svg
[npm-url]: https://npmjs.com/package/posthtml-parser

[node]: https://img.shields.io/node/v/posthtml-parser.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/posthtml/posthtml-parser.svg
[deps-url]: https://david-dm.org/posthtml/posthtml-parser

[tests]: http://img.shields.io/travis/posthtml/posthtml-parser.svg
[tests-url]: https://travis-ci.org/posthtml/posthtml-parser

[cover]: https://coveralls.io/repos/github/posthtml/posthtml-parser/badge.svg
[cover-url]: https://coveralls.io/github/posthtml/posthtml-parser

[chat]: https://badges.gitter.im/posthtml/posthtml.svg
[chat-url]: https://gitter.im/posthtml/posthtml
