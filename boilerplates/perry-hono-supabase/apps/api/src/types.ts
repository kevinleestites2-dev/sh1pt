import type { DbClient } from '@sh1pt/db';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AppVariables {
  user: AuthUser;
  db: DbClient;
  accessToken: string;
}

export interface AppBindings {
  Variables: AppVariables;
}
