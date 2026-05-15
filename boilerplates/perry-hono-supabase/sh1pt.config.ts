import { defineConfig } from '@profullstack/sh1pt-core';

export default defineConfig({
  name: 'sh1pt-perry-hono-supabase',
  version: '0.1.0',
  description:
    'PerryTS-first monorepo: native CLI/worker binaries, Hono API on Node/Bun (PerryTS experimental), Supabase, optional Next.js web shell.',
  recipe: 'monorepo-perry',
  recipeConfig: {},
  targets: {
    fly: {
      enabled: false,
      use: 'deploy-fly',
      config: { app: 'sh1pt-perry-hono-supabase', strategy: 'rolling' },
    },
    railway: {
      enabled: false,
      use: 'deploy-railway',
      config: { projectId: 'YOUR_PROJECT', serviceId: 'YOUR_SERVICE' },
    },
    docker: {
      enabled: false,
      use: 'pkg-docker',
      config: {
        image: 'yourorg/sh1pt-perry-hono-supabase',
        registries: [{ kind: 'ghcr' }, { kind: 'dockerhub' }],
        platforms: ['linux/amd64', 'linux/arm64'],
      },
    },
    perryCli: {
      enabled: false,
      use: 'pkg-perry',
      config: {
        entry: 'apps/cli/src/index.ts',
        out: 'dist/sh1pt-cli',
        platforms: ['linux-x64', 'linux-arm64', 'darwin-arm64', 'darwin-x64', 'windows-x64'],
      },
    },
    perryWorker: {
      enabled: false,
      use: 'pkg-perry',
      config: {
        entry: 'apps/worker/src/index.ts',
        out: 'dist/sh1pt-worker',
        platforms: ['linux-x64', 'linux-arm64', 'darwin-arm64', 'darwin-x64', 'windows-x64'],
      },
    },
  },
});
