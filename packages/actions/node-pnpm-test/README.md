# Node pnpm Test

Installs the lightweight test workflow used by the sh1pt repository.

The workflow runs on pull requests and pushes to the configured branch, installs with pnpm, and runs the configured test command with `CI=true`.

## Output

`node-pnpm-test` writes `.github/workflows/test.yml` through a pull request.
