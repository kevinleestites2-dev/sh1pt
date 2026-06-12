# Node pnpm CI

Installs a GitHub Actions workflow for Node and TypeScript projects that use pnpm.

The workflow installs dependencies, runs typecheck, and runs tests with explicit read-only repository permissions.

## Requirements

The repository's `package.json` must declare a `packageManager` field (e.g. `"packageManager": "pnpm@10.0.0"`). `pnpm/action-setup@v4` reads the pnpm version from there. The workflow does **not** pin a pnpm `version` itself — pinning one that disagrees with `packageManager` fails the run with `ERR_PNPM_BAD_PM_VERSION`.

## Output

`node-pnpm-ci` writes `.github/workflows/ci.yml` through a pull request.
