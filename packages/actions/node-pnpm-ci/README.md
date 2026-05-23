# Node pnpm CI

Installs a GitHub Actions workflow for Node and TypeScript projects that use pnpm.

The workflow installs dependencies, runs typecheck, and runs tests with explicit read-only repository permissions.

## Output

`node-pnpm-ci` writes `.github/workflows/ci.yml` through a pull request.
