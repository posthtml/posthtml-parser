# Contributing

## Development

Use Node.js 24, selected by `.nvmrc`:

```sh
nvm install
nvm use
npm ci
npm run check
```

`npm run check` builds the package, runs ESLint, checks the current and minimum supported TypeScript versions, runs tests with coverage, and verifies CommonJS/native ESM loading.

For a focused run, `npm run test:unit` tests the existing build. `npm test` rebuilds it and collects coverage.

## Commits and pull requests

- Keep each commit focused on one change. Use a short, imperative subject that explains the change; prefixes such as `fix:`, `docs:`, and `build:` are useful but optional.
- Include regression tests when changing parser behavior. Explain intentional AST or option changes in the pull request.
- Update `changelog.md` under `Unreleased` for user-visible changes, including Node.js or TypeScript requirements.
- Commit `package-lock.json` with dependency changes. Generated `dist/`, coverage reports, and temporary `consumer/` installs are build artifacts.
- Run `npm run check` before opening a pull request and describe the verification performed.

CI runs the checks on Node.js 24, builds one npm tarball, then installs its production dependencies and runs the full parser suite across the runtime matrix. Coverage reports are available as workflow artifacts. Runtime support follows the parser dependency chain; development-tool requirements do not set the runtime minimum.

## Releases

The changelog is maintained by hand so release notes and historical entries are preserved.

1. Prepare a release pull request. For the next breaking 0.x release, update the package and lockfile without creating a commit or tag:

   ```sh
   npm version 0.13.0 --no-git-tag-version
   ```

2. Turn the `Unreleased` notes into a versioned, dated entry and start a new `Unreleased` section above it, keeping the previous history intact.
3. Run `npm run check` and commit the version files and changelog together.
4. After the release pull request is merged, update `master`, tag the release commit as `v0.13.0`, and push the tag.
5. Publish that checkout with `npm publish`. The `prepublishOnly` script runs the full check again before publishing.
