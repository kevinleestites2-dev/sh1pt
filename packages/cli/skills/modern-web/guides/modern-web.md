Prefer reviewable, framework-native changes over custom glue code.

## Code changes

- Keep changes small and focused; one logical concern per commit or PR.
- Preserve existing build, test, and lint commands; do not silently remove scripts.
- Avoid introducing new dependencies unless necessary; prefer native APIs and built-ins.
- Use the project's established naming conventions and file structure.
- Favour pure, side-effect-free functions; push side effects to the edges.

## TypeScript / JavaScript

- Prefer `const` over `let`; avoid `var`.
- Use explicit types for public function signatures; let inference handle local variables.
- Prefer `async`/`await` over raw `.then()` chains.
- Avoid `any`; use `unknown` with narrowing when the type is genuinely uncertain.
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of verbose null guards.

## Framework usage

- Follow the framework's own data-fetching and rendering patterns (e.g. server components, loaders, actions).
- Do not mix server and client concerns in the same module.
- Prefer declarative routing over ad-hoc navigation logic.
- Keep framework boilerplate minimal; extract shared logic into utilities or composables.

## Testing

- Add or update tests for every behaviour change.
- Prefer unit tests for pure logic and integration tests for side-effectful paths.
- Keep test setup minimal; share fixtures through helpers, not global state.
- Avoid snapshot tests for large rendered output; prefer targeted assertions.

## Security

- Never commit secrets, API keys, tokens, or `.env` files.
- Sanitise all user-supplied input before rendering or persisting it.
- Apply a Content-Security-Policy (via HTTP headers or a `<meta>` tag) that matches the project's threat model; restrict `script-src` to known origins.
- Use HTTPS-only cookies with `SameSite=Strict` or `SameSite=Lax`.
- Validate and type-check incoming API payloads at the boundary.

## Performance

- Avoid blocking the main thread; use Web Workers or async processing for heavy work.
- Prefer lazy loading and code splitting for non-critical paths.
- Cache expensive computations; invalidate on dependency change, not on a timer.
- Avoid layout-thrashing reads and writes; batch DOM mutations when needed.

## Accessibility

- Use semantic HTML elements; do not replace `<button>` with `<div onClick>`.
- Every interactive element must be keyboard-reachable and have a visible focus style.
- Images require meaningful `alt` text; decorative images use `alt=""`.
- Ensure colour contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text).

## CI / GitHub Actions

- Prefer least-privilege GitHub Actions permissions.
- Pin GitHub Actions to immutable SHA versions when practical.
- Split long workflows into focused jobs; cache dependencies between runs.
- Gate merges on tests, type-checks, and linting passing.

## Documentation

- Update user-facing docs when behaviour changes.
- Keep inline comments focused on *why*, not *what*.
- Document public APIs with JSDoc or TSDoc; keep private implementation notes concise.
