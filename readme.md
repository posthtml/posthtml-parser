# PostHTML Parser

Parse HTML/XML into a [PostHTML AST](#posthtml-ast-format) using [htmlparser2](https://github.com/fb55/htmlparser2).

## Installation

Requires Node.js `^20.19.0 || >=22.12.0`. These versions support synchronous CommonJS loading of the ESM-only `htmlparser2` backend. Both `require()` and native ESM imports expose the synchronous `parser` API.

TypeScript consumers need TypeScript 5.3 or later.

```sh
npm install posthtml-parser
```

## Usage

```js
import { parser } from "posthtml-parser";

const tree = parser('<a class="link">Hello</a>');
console.log(tree);
```

Result:

```js
[
  {
    tag: "a",
    attrs: {
      class: "link"
    },
    content: ["Hello"]
  }
]
```

CommonJS is supported too:

```js
const { parser } = require("posthtml-parser");
```

## PostHTML AST Format

A tree is an array of strings and element objects. Elements have a `tag` and optional `attrs` and `content`; `content` is another tree. Comments and directives remain strings.

Valueless attributes are empty strings by default, or `true` with `recognizeNoValueAttribute`. Enabling `sourceLocations` adds a `location` with 1-based start/end line and column positions.

## Options

Pass options as the second argument to `parser(html, options)`:

| Option | Default | Description |
| --- | --- | --- |
| `directives` | `[]` | Extra directives with `name` (string or RegExp), `start`, and `end`. Doctypes are always included. |
| `xmlMode` | `false` | Parse XML, including CDATA and self-closing tags. |
| `decodeEntities` | `false` | Decode character entities, including text inside `textarea`. |
| `lowerCaseTags` | `false` | Lowercase element names, including SVG names. |
| `lowerCaseAttributeNames` | `false` | Lowercase attribute names. |
| `recognizeCDATA` | `xmlMode` | Recognize CDATA in HTML mode; XML always recognizes it. |
| `recognizeSelfClosing` | `xmlMode` | Recognize `<tag />` as a self-closing tag. |
| `sourceLocations` | `false` | Add source positions to element nodes. |
| `recognizeNoValueAttribute` | `false` | Represent valueless attributes as `true` instead of empty strings. |

For example, preserve a PHP directive:

```js
parser('<?php echo "Hello"; ?>', {
  directives: [{ name: "?php", start: "<", end: ">" }]
});
```

## Contributing

See [contributing and release instructions](https://github.com/posthtml/posthtml-parser/blob/master/.github/CONTRIBUTING.md) for development commands, commit guidelines, and publishing.

Maintainer: [Ivan Voischev](mailto:voischev.ivan@ya.ru).

## License

[MIT](license).
