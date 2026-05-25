import { describe, it, expect } from 'vitest';
import {
  loadActionsRegistry,
  loadSkillsRegistry,
  loadPacksRegistry,
} from './index.js';

describe('loadActionsRegistry', () => {
  it('loads at least one action entry', async () => {
    const entries = await loadActionsRegistry();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('includes the vu1nz-scan action', async () => {
    const entries = await loadActionsRegistry();
    const entry = entries.find((e) => e.name === 'vu1nz-scan');
    expect(entry).toBeDefined();
    expect(entry?.publisher).toBe('profullstack');
    expect(entry?.trustLevel).toBe('verified');
    expect(entry?.category).toBe('security');
    expect(entry?.path).toMatch(/sh1pt\.actionpack\.yaml$/);
  });

  it('includes the node-pnpm-ci action', async () => {
    const entries = await loadActionsRegistry();
    const entry = entries.find((e) => e.name === 'node-pnpm-ci');
    expect(entry).toBeDefined();
    expect(entry?.trustLevel).toBe('official');
    expect(entry?.category).toBe('ci');
  });

  it('includes the node-pnpm-test action', async () => {
    const entries = await loadActionsRegistry();
    const entry = entries.find((e) => e.name === 'node-pnpm-test');
    expect(entry).toBeDefined();
    expect(entry?.trustLevel).toBe('official');
    expect(entry?.category).toBe('test');
  });

  it('every entry has required fields', async () => {
    const entries = await loadActionsRegistry();
    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.publisher).toBeTruthy();
      expect(entry.version).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.trustLevel).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.path).toBeTruthy();
    }
  });
});

describe('loadSkillsRegistry', () => {
  it('loads at least one skill entry', async () => {
    const entries = await loadSkillsRegistry();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('includes the modern-web skill', async () => {
    const entries = await loadSkillsRegistry();
    const entry = entries.find((e) => e.name === 'modern-web');
    expect(entry).toBeDefined();
    expect(entry?.publisher).toBe('profullstack');
    expect(entry?.trustLevel).toBe('verified');
    expect(entry?.category).toBe('web');
    expect(entry?.path).toMatch(/sh1pt\.skill\.json$/);
  });

  it('every entry has required fields', async () => {
    const entries = await loadSkillsRegistry();
    for (const entry of entries) {
      expect(entry.name).toBeTruthy();
      expect(entry.publisher).toBeTruthy();
      expect(entry.version).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.trustLevel).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.path).toBeTruthy();
    }
  });
});

describe('loadPacksRegistry', () => {
  it('returns an array (may be empty)', async () => {
    const entries = await loadPacksRegistry();
    expect(Array.isArray(entries)).toBe(true);
  });
});
