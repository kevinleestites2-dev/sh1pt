# @sh1pt/cli

PerryTS-compiled native CLI. Runs under Node/Bun during dev (`pnpm dev`),
ships as a single binary via `perry compile` (`pnpm build:perry`).

## Commands

```
sh1pt login [--token <jwt>]
sh1pt logout
sh1pt status
sh1pt jobs list
sh1pt jobs get <id>
sh1pt jobs create <type> [json-input]
sh1pt jobs cancel <id>
```

## Auth

v1 uses manual access-token paste (or `--token`). Tokens are stored in
`~/.config/sh1pt/config.json` (mode `0600`). Future: device-code flow.

## Building a native binary

```
perry compile src/index.ts -o ../../dist/sh1pt-cli
```

Or from the repo root:

```
pnpm perry:build:cli
```
