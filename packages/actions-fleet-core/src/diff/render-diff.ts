import type { DiffPlan, PlannedFileDiff } from './plan.js';

// ---------- LCS-based unified diff engine ----------

type EditOp = { kind: 'equal' | 'add' | 'remove'; line: string };

/**
 * Compute the longest common subsequence length table for two line arrays.
 * Uses O(m*n) DP — sufficient for typical workflow files (< 2 000 lines).
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // All indices are within bounds by construction; non-null assertions are safe.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp;
}

/** Iterative back-track of the LCS table to produce a sequence of edit operations. */
function diffLines(oldLines: string[], newLines: string[]): EditOp[] {
  const dp = lcsTable(oldLines, newLines);
  const ops: EditOp[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  while (i > 0 || j > 0) {
    if (i === 0) {
      ops.unshift({ kind: 'add', line: newLines[j - 1]! });
      j--;
    } else if (j === 0) {
      ops.unshift({ kind: 'remove', line: oldLines[i - 1]! });
      i--;
    } else if (oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({ kind: 'equal', line: oldLines[i - 1]! });
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      ops.unshift({ kind: 'remove', line: oldLines[i - 1]! });
      i--;
    } else {
      ops.unshift({ kind: 'add', line: newLines[j - 1]! });
      j--;
    }
  }
  return ops;
}

interface Hunk {
  oldStart: number;
  newStart: number;
  lines: string[];
}

/**
 * Group edit operations into unified-diff hunks with the given context radius.
 */
function buildHunks(ops: EditOp[], context: number): Hunk[] {
  const hunks: Hunk[] = [];
  let oldLine = 1;
  let newLine = 1;

  // Collect all change positions (in terms of op index)
  const changeIndices: number[] = [];
  for (let idx = 0; idx < ops.length; idx++) {
    if (ops[idx]!.kind !== 'equal') changeIndices.push(idx);
  }

  let idx = 0;
  while (idx < changeIndices.length) {
    const firstChange = changeIndices[idx]!;
    const contextStart = Math.max(0, firstChange - context);

    // Extend until no more changes within context distance
    let lastIncluded = firstChange;
    let k = idx;
    while (k < changeIndices.length) {
      const curr = changeIndices[k]!;
      if (curr <= lastIncluded + 2 * context + 1) {
        lastIncluded = curr;
        k++;
      } else {
        break;
      }
    }
    idx = k;

    const contextEnd = Math.min(ops.length - 1, lastIncluded + context);

    // Compute line numbers up to contextStart
    let o = oldLine;
    let n = newLine;
    for (let i = 0; i < contextStart; i++) {
      const op = ops[i]!;
      if (op.kind !== 'add') o++;
      if (op.kind !== 'remove') n++;
    }

    const hunkLines: string[] = [];
    let hunkOldStart = o;
    let hunkNewStart = n;

    for (let i = contextStart; i <= contextEnd; i++) {
      const op = ops[i]!;
      if (op.kind === 'equal') {
        hunkLines.push(` ${op.line}`);
        o++;
        n++;
      } else if (op.kind === 'remove') {
        hunkLines.push(`-${op.line}`);
        o++;
      } else {
        hunkLines.push(`+${op.line}`);
        n++;
      }
    }

    // Count old/new line spans for the @@ header
    let oldCount = 0;
    let newCount = 0;
    for (const l of hunkLines) {
      if (l.startsWith('-')) oldCount++;
      else if (l.startsWith('+')) newCount++;
      else { oldCount++; newCount++; }
    }

    const header =
      oldCount === 1 && newCount === 1
        ? `@@ -${hunkOldStart} +${hunkNewStart} @@`
        : `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@`;

    hunks.push({ oldStart: hunkOldStart, newStart: hunkNewStart, lines: [header, ...hunkLines] });

    // Advance the running line counters past contextEnd
    for (let i = 0; i <= contextEnd; i++) {
      const op = ops[i]!;
      if (op.kind !== 'add') oldLine++;
      if (op.kind !== 'remove') newLine++;
    }
  }

  return hunks;
}

// ---------- Public API ----------

/**
 * Render a unified diff between `oldContent` (or null for new files) and
 * `newContent` for the given `filename`.
 *
 * Returns an empty string when the contents are identical.
 */
export function renderUnifiedDiff(
  oldContent: string | null,
  newContent: string,
  filename: string,
  contextLines = 3,
): string {
  const oldText = oldContent ?? '';
  if (oldText === newContent) return '';

  const isNew = oldContent === null;
  const oldLabel = isNew ? '/dev/null' : `a/${filename}`;
  const newLabel = `b/${filename}`;

  const oldLines = oldText === '' ? [] : oldText.split('\n');
  const newLines = newContent === '' ? [] : newContent.split('\n');

  // Strip trailing empty string caused by a trailing newline
  if (oldLines[oldLines.length - 1] === '') oldLines.pop();
  if (newLines[newLines.length - 1] === '') newLines.pop();

  const ops = diffLines(oldLines, newLines);
  const hunks = buildHunks(ops, contextLines);

  if (hunks.length === 0) return '';

  const parts: string[] = [
    `--- ${oldLabel}`,
    `+++ ${newLabel}`,
  ];
  for (const hunk of hunks) {
    parts.push(...hunk.lines);
  }
  return parts.join('\n') + '\n';
}

/**
 * Render a human-readable diff preview for every file in a `DiffPlan`.
 *
 * - **create**: shows all lines as additions
 * - **update-managed**: shows a unified diff of old vs new
 * - **unchanged**: omitted (nothing to show)
 * - **conflict-unmanaged / conflict-other-pack**: shows a warning header with
 *   the proposed new content as additions so reviewers can assess the risk
 *
 * Returns a plain-text string suitable for printing to a terminal or storing in
 * a PR description.
 */
export function renderPlanPreview(plan: DiffPlan, contextLines = 3): string {
  const sections: string[] = [];

  for (const file of plan.files) {
    const section = renderFileDiffSection(file, contextLines);
    if (section) sections.push(section);
  }

  if (sections.length === 0) return '(no changes)\n';
  return sections.join('\n');
}

function renderFileDiffSection(file: PlannedFileDiff, contextLines: number): string | null {
  switch (file.status.kind) {
    case 'unchanged':
      return null;

    case 'create': {
      const diff = renderUnifiedDiff(null, file.newContent, file.destination, contextLines);
      return diff || null;
    }

    case 'update-managed': {
      // For update-managed, the file existed on disk when the plan was built.
      // existingContent is guaranteed to be non-null in this state.
      const existing = file.existingContent ?? '';
      const diff = renderUnifiedDiff(existing, file.newContent, file.destination, contextLines);
      return diff || null;
    }

    case 'conflict-unmanaged': {
      const header = [
        `# CONFLICT (unmanaged): ${file.destination}`,
        '# This file exists but is not managed by sh1pt Actions Fleet.',
        '# Re-run with --force to overwrite.',
        '#',
      ].join('\n');
      const diff = renderUnifiedDiff(
        file.existingContent,
        file.newContent,
        file.destination,
        contextLines,
      );
      return `${header}\n${diff || '(no diff available)\n'}`;
    }

    case 'conflict-other-pack': {
      const { existingPackId, existingPackVersion } = file.status;
      const header = [
        `# CONFLICT (other-pack): ${file.destination}`,
        `# This file is already managed by pack ${existingPackId}@${existingPackVersion}.`,
        '# Re-run with --force to overwrite.',
        '#',
      ].join('\n');
      const diff = renderUnifiedDiff(
        file.existingContent,
        file.newContent,
        file.destination,
        contextLines,
      );
      return `${header}\n${diff || '(no diff available)\n'}`;
    }
  }
}
