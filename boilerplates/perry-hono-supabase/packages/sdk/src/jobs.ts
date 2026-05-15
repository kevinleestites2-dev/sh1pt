import type {
  Job,
  JobCreateInput,
  JobCompleteInput,
  JobFailInput,
  HeartbeatInput,
} from '@sh1pt/schemas';
import type { HttpClient } from './client.ts';

export function createJobsApi(http: HttpClient) {
  return {
    list(): Promise<Job[]> {
      return http.request<Job[]>('/jobs');
    },
    get(id: string): Promise<Job> {
      return http.request<Job>(`/jobs/${encodeURIComponent(id)}`);
    },
    create(input: JobCreateInput): Promise<Job> {
      return http.request<Job>('/jobs', { method: 'POST', body: input });
    },
    cancel(id: string): Promise<Job> {
      return http.request<Job>(`/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
    },
  };
}

export function createWorkerApi(http: HttpClient) {
  return {
    heartbeat(input: HeartbeatInput): Promise<{ ok: true }> {
      return http.request<{ ok: true }>('/worker/heartbeat', { method: 'POST', body: input });
    },
    nextJob(): Promise<Job | null> {
      return http.request<Job | null>('/worker/jobs/next');
    },
    completeJob(id: string, input: JobCompleteInput): Promise<Job> {
      return http.request<Job>(`/worker/jobs/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        body: input,
      });
    },
    failJob(id: string, input: JobFailInput): Promise<Job> {
      return http.request<Job>(`/worker/jobs/${encodeURIComponent(id)}/fail`, {
        method: 'POST',
        body: input,
      });
    },
  };
}
