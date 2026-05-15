import type { Job, JobStatus } from '@sh1pt/schemas';
import { DomainError } from './errors.ts';

const TERMINAL: ReadonlySet<JobStatus> = new Set(['succeeded', 'failed', 'cancelled']);

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL.has(status);
}

export function assertCancellable(job: Pick<Job, 'status'>): void {
  if (isTerminal(job.status)) {
    throw new DomainError(
      `cannot cancel job in terminal status ${job.status}`,
      'invalid_state',
      409,
    );
  }
}

export function assertCanComplete(job: Pick<Job, 'status'>): void {
  if (job.status !== 'running') {
    throw new DomainError(
      `cannot complete job in status ${job.status}`,
      'invalid_state',
      409,
    );
  }
}
