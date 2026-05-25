import { describe, expect, it } from 'vitest';
import { auditWorkflowContent, createActionsCmd } from './build-actions.js';

describe('actions command aliases', () => {
  const actionsCmd = createActionsCmd();
  it('supports `info` as an alias for `show`', () => {
    const showCmd = actionsCmd.commands.find((c) => c.name() === 'show');
    expect(showCmd).toBeDefined();
    expect(showCmd?.aliases()).toContain('info');
  });

  it('supports a search subcommand for pack discovery', () => {
    const searchCmd = actionsCmd.commands.find((c) => c.name() === 'search');
    expect(searchCmd).toBeDefined();
  });
});

describe('auditWorkflowContent', () => {
  it('detects unsafe patterns', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Test
on:
  pull_request_target:
permissions: write-all
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - run: curl https://example.com/install.sh | bash
      - run: wget https://example.com/install.sh | sh
      - run: echo ok
    container:
      image: node:22
`);

    expect(findings.map((f) => f.rule)).toEqual(expect.arrayContaining([
      'write-all-permissions',
      'pull-request-target',
      'unpinned-action-branch',
      'curl-pipe-bash',
      'wget-pipe-bash',
      'unpinned-docker-image',
    ]));
  });

  it('does not report findings for a safer workflow', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Safe
on:
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test
`);

    expect(findings).toHaveLength(0);
  });

  it('detects secrets interpolated in run steps', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Secrets Test
on: push
permissions:
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: curl -H "Authorization: \${{ secrets.API_TOKEN }}" https://example.com
`);

    expect(findings.map((f) => f.rule)).toContain('secrets-in-run');
    const finding = findings.find((f) => f.rule === 'secrets-in-run');
    expect(finding?.severity).toBe('high');
  });

  it('does not flag secrets used in env: blocks', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Safe Secrets
on: push
permissions:
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      TOKEN: \${{ secrets.API_TOKEN }}
    steps:
      - run: curl -H "Authorization: $TOKEN" https://example.com
`);

    expect(findings.map((f) => f.rule)).not.toContain('secrets-in-run');
  });

  it('flags third-party actions not pinned to a SHA', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Third Party Test
on: push
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: some-org/cool-action@v2.1.0
`);

    expect(findings.map((f) => f.rule)).toContain('third-party-action');
    const finding = findings.find((f) => f.rule === 'third-party-action');
    expect(finding?.severity).toBe('low');
    expect(finding?.message).toContain('some-org/cool-action');
  });

  it('does not flag trusted-org actions or SHA-pinned actions', () => {
    const findings = auditWorkflowContent('workflow.yml', `
name: Pinned Test
on: push
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - uses: some-org/cool-action@a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
`);

    expect(findings.map((f) => f.rule)).not.toContain('third-party-action');
  });
});
