import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderUnifiedDiff, renderPlanPreview } from './render-diff.js';
import { planDiff } from './plan.js';
import type { RenderResult } from '../action-pack/render.js';

function bodyHash(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

function withHeader(packId: string, version: string, hash: string, body: string): string {
  return [
    '# Managed by sh1pt Actions Fleet',
    `# pack: ${packId}@${version}`,
    '# install: sh1pt-actions-store',
    `# hash: sha256:${hash}`,
    '',
    body,
  ].join('\n');
}

function makeRender(content: string, hash: string, destination = '.github/workflows/ci.yml'): RenderResult {
  return {
    packId: 'test-pack',
    packVersion: '1.0.0',
    files: [
      {
        source: 'ci.yml.hbs',
        destination,
        mergeStrategy: 'replace-managed',
        content,
        hash,
      },
    ],
  };
}

// ---------- renderUnifiedDiff ----------

describe('renderUnifiedDiff', () => {
  it('returns empty string for identical content', () => {
    const text = 'line1\nline2\n';
    expect(renderUnifiedDiff(text, text, 'file.txt')).toBe('');
  });

  it('shows all lines as additions for a new file (null old content)', () => {
    const diff = renderUnifiedDiff(null, 'line1\nline2\n', 'new.yml');
    expect(diff).toContain('+line1');
    expect(diff).toContain('+line2');
    expect(diff).toContain('--- /dev/null');
    expect(diff).toContain('+++ b/new.yml');
    // No removal lines (lines starting with a single '-', not the '---' header)
    const removalLines = diff.split('\n').filter((l) => /^-(?!-)/.test(l));
    expect(removalLines).toHaveLength(0);
  });

  it('shows removed lines with - prefix', () => {
    const diff = renderUnifiedDiff('old\n', 'new\n', 'file.txt');
    expect(diff).toContain('-old');
    expect(diff).toContain('+new');
  });

  it('includes @@ hunk header', () => {
    const diff = renderUnifiedDiff('a\n', 'b\n', 'file.txt');
    expect(diff).toContain('@@');
  });

  it('includes context lines around changes', () => {
    const oldContent = ['ctx1', 'ctx2', 'ctx3', 'CHANGE', 'ctx4', 'ctx5', 'ctx6'].join('\n') + '\n';
    const newContent = ['ctx1', 'ctx2', 'ctx3', 'CHANGED', 'ctx4', 'ctx5', 'ctx6'].join('\n') + '\n';
    const diff = renderUnifiedDiff(oldContent, newContent, 'file.txt');
    expect(diff).toContain(' ctx1');
    expect(diff).toContain(' ctx6');
    expect(diff).toContain('-CHANGE');
    expect(diff).toContain('+CHANGED');
  });

  it('respects custom context line count', () => {
    const oldContent = ['a', 'b', 'c', 'CHANGE', 'd', 'e', 'f'].join('\n') + '\n';
    const newContent = ['a', 'b', 'c', 'CHANGED', 'd', 'e', 'f'].join('\n') + '\n';
    const diff1 = renderUnifiedDiff(oldContent, newContent, 'file.txt', 1);
    const diff3 = renderUnifiedDiff(oldContent, newContent, 'file.txt', 3);
    // With 1 line of context, lines 'a' and 'b' should NOT appear as context lines
    const contextLines1 = diff1.split('\n').filter((l) => /^ /.test(l));
    expect(contextLines1.some((l) => l.trim() === 'a')).toBe(false);
    // With 3 lines of context, 'a' should appear as a context line
    const contextLines3 = diff3.split('\n').filter((l) => /^ /.test(l));
    expect(contextLines3.some((l) => l.trim() === 'a')).toBe(true);
  });
});

// ---------- renderPlanPreview ----------

describe('renderPlanPreview', () => {
  const body = 'name: CI\non: push\n';
  const hash = bodyHash(body);
  const newContent = withHeader('test-pack', '1.0.0', hash, body);

  it('returns "(no changes)" when all files are unchanged', async () => {
    const repoDir = await mkdtemp(join(tmpdir(), 'sh1pt-diff-preview-'));
    try {
      const plan = await planDiff({
        repoDir,
        render: makeRender(newContent, hash),
        readExisting: async () => withHeader('test-pack', '1.0.0', hash, body),
      });
      const preview = renderPlanPreview(plan);
      expect(preview.trim()).toBe('(no changes)');
    } finally {
      await rm(repoDir, { recursive: true, force: true });
    }
  });

  it('shows additions for a new file', async () => {
    const repoDir = await mkdtemp(join(tmpdir(), 'sh1pt-diff-preview-'));
    try {
      const plan = await planDiff({
        repoDir,
        render: makeRender(newContent, hash),
        readExisting: async () => null,
      });
      const preview = renderPlanPreview(plan);
      expect(preview).toContain('--- /dev/null');
      expect(preview).toContain('+++ b/.github/workflows/ci.yml');
      expect(preview).toContain('+name: CI');
    } finally {
      await rm(repoDir, { recursive: true, force: true });
    }
  });

  it('shows a unified diff for an updated file', async () => {
    const repoDir = await mkdtemp(join(tmpdir(), 'sh1pt-diff-preview-'));
    try {
      const oldBody = 'name: OLD\non: push\n';
      const oldHash = bodyHash(oldBody);
      const oldContent = withHeader('test-pack', '0.9.0', oldHash, oldBody);

      const plan = await planDiff({
        repoDir,
        render: makeRender(newContent, hash),
        readExisting: async () => oldContent,
      });
      const preview = renderPlanPreview(plan);
      expect(preview).toContain('-name: OLD');
      expect(preview).toContain('+name: CI');
    } finally {
      await rm(repoDir, { recursive: true, force: true });
    }
  });

  it('shows a conflict warning for unmanaged files', async () => {
    const repoDir = await mkdtemp(join(tmpdir(), 'sh1pt-diff-preview-'));
    try {
      const plan = await planDiff({
        repoDir,
        render: makeRender(newContent, hash),
        readExisting: async () => 'name: existing\n',
      });
      const preview = renderPlanPreview(plan);
      expect(preview).toContain('CONFLICT (unmanaged)');
      expect(preview).toContain('--force');
    } finally {
      await rm(repoDir, { recursive: true, force: true });
    }
  });

  it('shows a conflict warning for other-pack files', async () => {
    const repoDir = await mkdtemp(join(tmpdir(), 'sh1pt-diff-preview-'));
    try {
      const otherBody = 'name: other\n';
      const plan = await planDiff({
        repoDir,
        render: makeRender(newContent, hash),
        readExisting: async () => withHeader('other-pack', '2.0.0', bodyHash(otherBody), otherBody),
      });
      const preview = renderPlanPreview(plan);
      expect(preview).toContain('CONFLICT (other-pack)');
      expect(preview).toContain('other-pack@2.0.0');
    } finally {
      await rm(repoDir, { recursive: true, force: true });
    }
  });
});
