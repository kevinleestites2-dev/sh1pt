#!/usr/bin/env node
import('../dist/index.js')
  .then(({ run }) => run(process.argv.slice(2)))
  .catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  });
