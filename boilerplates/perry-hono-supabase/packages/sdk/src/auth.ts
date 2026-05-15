import type { LoginInput, RefreshInput, Session, Profile } from '@sh1pt/schemas';
import type { HttpClient } from './client.ts';

export function createAuthApi(http: HttpClient) {
  return {
    login(input: LoginInput): Promise<Session> {
      return http.request<Session>('/auth/login', { method: 'POST', body: input });
    },
    logout(): Promise<void> {
      return http.request<void>('/auth/logout', { method: 'POST' });
    },
    refresh(input: RefreshInput): Promise<Session> {
      return http.request<Session>('/auth/refresh', { method: 'POST', body: input });
    },
    me(): Promise<Profile> {
      return http.request<Profile>('/me');
    },
  };
}
