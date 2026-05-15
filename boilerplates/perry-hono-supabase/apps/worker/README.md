# @sh1pt/worker

Long-running PerryTS-compiled worker. Polls the central API for jobs and
emits a heartbeat with its capabilities.

## Required env

```
API_URL                http://localhost:3001
SH1PT_WORKER_TOKEN     access token for the user that owns this device
SH1PT_DEVICE_ID        UUID returned by POST /devices/register
SH1PT_POLL_MS          job poll interval (default 2000)
SH1PT_HEARTBEAT_MS     heartbeat interval (default 15000)
```

## Adding a job handler

1. Create a new file under `src/jobs/`.
2. Export a `JobHandler` and register it in the `handlers` Map in
   `src/jobs/example.ts` (or a barrel module of your choosing).

## Building a native binary

```
perry compile src/index.ts -o ../../dist/sh1pt-worker
```

Or from the repo root:

```
pnpm perry:build:worker
```
