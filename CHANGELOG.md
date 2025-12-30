# Changelog

All notable changes to this project will be documented in this file.

This project currently documents changes manually.

## 1.0.0 - 2025-12-30

- Initial public release of `domMan` / `$d`
- Chainable DOM utility with multi-selection conventions (setters/actions apply to all; getters read from first)
- Proxy-powered dynamic API for DOM methods, DOM properties, and CSS shortcuts
- Event API including direct and delegated handlers, `one()`, `trigger()`, `triggerHandler()`, and namespaced DOM events
- TypeScript typings via `index.d.ts`
- Automated tests using Node test runner + jsdom

## 1.0.1 - 2025-12-30

- Renamed UMD bundle to `domman.js` and updated docs/tests/demo references
- Silenced runtime `console.warn/error` output by default (now gated behind `domMan.debugMode`)
- Improved npm publish hygiene via `files`/`exports` in `package.json`

## 1.0.2 - 2025-12-30

- Updated npm package name to the scoped `@aliborsan/dommanager` (due to npm similarity restrictions)
- Updated README install instructions for npm + bundlers
