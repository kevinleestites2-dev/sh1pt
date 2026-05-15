import type { Profile, ProfileUpdateInput } from '@sh1pt/schemas';

export function applyProfileUpdate(
  current: Profile,
  patch: ProfileUpdateInput,
): Profile {
  return {
    ...current,
    displayName: patch.displayName ?? current.displayName,
    updatedAt: new Date().toISOString(),
  };
}
