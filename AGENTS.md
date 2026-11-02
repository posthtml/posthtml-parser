# Working on posthtml-parser

## Scope and workspace

This repository adapts `htmlparser2` to the PostHTML AST. Read `.github/CONTRIBUTING.md` and `package.json` before editing. Inspect Git status and preserve existing work.

For changes spanning the three packages, also read `../posthtml/AGENTS.md` when that sibling checkout exists. The shared guide is published at `https://github.com/posthtml/posthtml/blob/master/AGENTS.md`. Each package is a separate Git repository; keep its branch and commits separate.

## Commands and files

Use Node.js 24 from `.nvmrc`:

```sh
npm ci
npm run check
```

- `src/index.ts`: event adapter, options, directives, attributes and AST types.
- `src/location-tracker.ts`: 1-based source positions and monotonic index tracking.
- `test/core.test.cjs`: native Node.js regression tests against the built package.
- `test/package.cjs`: CommonJS/native ESM checks.
- `test/types`: CJS/ESM consumer declarations, including the minimum supported compiler.

`npm test` rebuilds and collects coverage. `npm run test:unit` uses the existing build. Build with `tsc`; generated JavaScript, declarations and source maps live in ignored `dist/`.

## Compatibility rules

Follow the actual `htmlparser2` runtime and module-loading requirements rather than the development Node.js version. Verify both minimum Node.js branches and both CJS/ESM entrypoints when changing the backend.

Preserve case and entity defaults, comments/directives as strings, custom directive delimiters, XML instructions, valueless attributes and exact source locations. Backend callback changes can affect these even when simple HTML still parses. Add regression tests before adjusting the adapter; do not update expectations merely to accept an accidental backend change.

The source-location and XML-instruction compatibility code is intentional. Check adjacent instructions, a following tag without whitespace, and implied EOF closure before simplifying it.

The public declarations import ESM backend types. Preserve type-only resolution mode and run consumer fixtures with both the current and minimum supported TypeScript versions.

## Cross-package validation and releases

After parser checks, pack the built package with `npm pack --ignore-scripts`. From the core repository, run `npm run test:packed -- <core.tgz> --parser <parser.tgz>`; add `--render <render.tgz>` when testing a renderer candidate too. This checks the adapter through the real plugin and renderer pipeline without hidden links.

Coordinate AST/declaration changes with `posthtml-render`, whose runtime is independent but whose declarations reference parser types. Confirm parser/render/core round trips for directives, entities, SVG/XML, boolean attributes and source locations.

Maintain changelog notes by hand. Do not commit generated output or caches. Follow the release PR/tag/publication procedure in `.github/CONTRIBUTING.md`; publishing requires an explicit request and a verified npm result. Release the parser before a core version that depends on it.
