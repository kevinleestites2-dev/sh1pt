import { describe, expect, it } from 'vitest';
import { auditWorkflowContent, createActionsCmd, deriveTrustLevel } from './build-actions.js';

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

  it('has a list subcommand', () => {
    const listCmd = actionsCmd.commands.find((c) => c.name() === 'list');
    expect(listCmd).toBeDefined();
  });
});

describe('deriveTrustLevel', () => {
  const base = {
    leastPrivilegePermissions: true,
    pinThirdPartyActions: 'optional' as const,
    allowPullRequestTarget: false,
    defaultTimeoutMinutes: 15,
  };

  it('returns "high" when all conditions are met', () => {
    expect(deriveTrustLevel({ ...base, pinThirdPartyActions: 'required' })).toBe('high');
  });

  it('returns "medium" when least-privilege and no pull-request-target but pinning is not required', () => {
    expect(deriveTrustLevel({ ...base, pinThirdPartyActions: 'optional' })).toBe('medium');
    expect(deriveTrustLevel({ ...base, pinThirdPartyActions: 'off' })).toBe('medium');
  });

  it('returns "low" when leastPrivilegePermissions is false', () => {
    expect(deriveTrustLevel({ ...base, leastPrivilegePermissions: false })).toBe('low');
  });

  it('returns "low" when allowPullRequestTarget is true', () => {
    expect(deriveTrustLevel({ ...base, allowPullRequestTarget: true })).toBe('low');
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
});
