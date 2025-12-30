# Contributing to domMan

Thanks for considering contributing.

## Development setup

```bash
npm install
```

## Run tests

```bash
npm test
```

- Tests use Node’s built-in test runner + jsdom.
- Please add/adjust tests for behavior changes, bug fixes, and new features.

## Project goals (high-level)

- Keep the API ergonomic and chainable.
- Prefer **backwards-compatible** changes.
- Document public methods with **JSDoc**.
- Maintain a clear rule: setters/actions apply to all matched elements; getters read from the first.

## Documentation

### JSDoc style

- Use `/** ... */` blocks directly above functions.
- Include `@param` for each parameter.
- Use accurate return types (`@returns`).
- When a method has getter/setter overload behavior, document both.

### README updates

If you add or change a public method, update the README examples when it affects:
- selection behavior
- events / namespaces
- TypeScript typings

## TypeScript typings

Types are in [index.d.ts](index.d.ts).

If you change any public API signature (especially events), update typings in the same PR.

## Pull requests

- Keep PRs focused and small when possible.
- Include a short description + rationale.
- Include tests for bug fixes.
- Avoid unrelated formatting churn.
