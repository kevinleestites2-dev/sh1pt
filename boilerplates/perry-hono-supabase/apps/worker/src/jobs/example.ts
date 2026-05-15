import type { Job } from '@sh1pt/schemas';

export interface JobHandler {
  type: string;
  run(job: Job): Promise<Record<string, unknown>>;
}

export const exampleHandler: JobHandler = {
  type: 'example',
  async run(job) {
    const message =
      typeof job.input.message === 'string' ? job.input.message : 'hello';
    return { echoed: message, at: new Date().toISOString() };
  },
};

export const handlers = new Map<string, JobHandler>([[exampleHandler.type, exampleHandler]]);
