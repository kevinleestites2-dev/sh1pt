import type { Profile, ProfileUpdateInput } from '@sh1pt/schemas';
import type { HttpClient } from './client.ts';

export function createUsersApi(http: HttpClient) {
  return {
    me(): Promise<Profile> {
      return http.request<Profile>('/me');
    },
    update(input: ProfileUpdateInput): Promise<Profile> {
      return http.request<Profile>('/me', { method: 'PATCH', body: input });
    },
  };
}
