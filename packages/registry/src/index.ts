import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = join(here, '..');

/** A single entry in the actions registry index. */
export interface ActionRegistryEntry {
  name: string;
  publisher: string;
  version: string;
  description: string;
  trustLevel: 'official' | 'verified' | 'community' | 'experimental' | 'untrusted';
  category: string;
  /** Relative path (from the monorepo root) to the pack manifest file. */
  path: string;
}

/** A single entry in the skills registry index. */
export interface SkillRegistryEntry {
  name: string;
  publisher: string;
  version: string;
  description: string;
  trustLevel: 'official' | 'verified' | 'community' | 'experimental' | 'untrusted';
  category: string;
  /** Relative path (from the monorepo root) to the skill manifest file. */
  path: string;
}

/** A single entry in the packs registry index. */
export interface PackRegistryEntry {
  name: string;
  publisher: string;
  version: string;
  description: string;
  trustLevel: 'official' | 'verified' | 'community' | 'experimental' | 'untrusted';
  category: string;
  /** Relative path (from the monorepo root) to the pack manifest file. */
  path: string;
}

async function loadJsonFile<T>(filePath: string): Promise<T[]> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (cause) {
    throw new Error(`Failed to read registry file "${filePath}": ${(cause as Error).message}`, { cause });
  }
  try {
    return JSON.parse(text) as T[];
  } catch (cause) {
    throw new Error(`Failed to parse registry file "${filePath}": ${(cause as Error).message}`, { cause });
  }
}

/**
 * Load the actions registry index from `actions.json`.
 * Returns an array of {@link ActionRegistryEntry} objects.
 */
export async function loadActionsRegistry(): Promise<ActionRegistryEntry[]> {
  return loadJsonFile<ActionRegistryEntry>(join(REGISTRY_DIR, 'actions.json'));
}

/**
 * Load the skills registry index from `skills.json`.
 * Returns an array of {@link SkillRegistryEntry} objects.
 */
export async function loadSkillsRegistry(): Promise<SkillRegistryEntry[]> {
  return loadJsonFile<SkillRegistryEntry>(join(REGISTRY_DIR, 'skills.json'));
}

/**
 * Load the packs registry index from `packs.json`.
 * Returns an array of {@link PackRegistryEntry} objects.
 */
export async function loadPacksRegistry(): Promise<PackRegistryEntry[]> {
  return loadJsonFile<PackRegistryEntry>(join(REGISTRY_DIR, 'packs.json'));
}
