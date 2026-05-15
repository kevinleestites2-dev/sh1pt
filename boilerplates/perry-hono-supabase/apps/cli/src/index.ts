#!/usr/bin/env node
import { loginCmd, logoutCmd } from './commands/login.ts';
import { statusCmd } from './commands/status.ts';
import {
  jobsListCmd,
  jobsGetCmd,
  jobsCreateCmd,
  jobsCancelCmd,
} from './commands/jobs.ts';

const HELP = `sh1pt — PerryTS-compiled CLI for the sh1pt API

Usage:
  sh1pt login [--token <jwt>]
  sh1pt logout
  sh1pt status
  sh1pt jobs list
  sh1pt jobs get <id>
  sh1pt jobs create <type> [json-input]
  sh1pt jobs cancel <id>

Env:
  API_URL                 default API base (overrides config)
`;

async function main(argv: string[]): Promise<number> {
  const [cmd, sub, ...rest] = argv;
  switch (cmd) {
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      console.log(HELP);
      return 0;
    case 'login':
      return loginCmd([sub, ...rest].filter(Boolean) as string[]);
    case 'logout':
      return logoutCmd();
    case 'status':
      return statusCmd();
    case 'jobs': {
      switch (sub) {
        case 'list':
          return jobsListCmd();
        case 'get':
          return jobsGetCmd(rest);
        case 'create':
          return jobsCreateCmd(rest);
        case 'cancel':
          return jobsCancelCmd(rest);
        default:
          console.error(`Unknown jobs subcommand: ${sub ?? '(none)'}`);
          return 1;
      }
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error(HELP);
      return 1;
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  },
);
