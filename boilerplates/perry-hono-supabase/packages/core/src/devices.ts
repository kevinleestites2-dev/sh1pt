import type { Device, DeviceKind } from '@sh1pt/schemas';
import { ForbiddenError } from './errors.ts';

const HEARTBEAT_FRESH_MS = 60_000;

export function isDeviceFresh(device: Pick<Device, 'lastSeenAt'>, now = Date.now()): boolean {
  if (!device.lastSeenAt) return false;
  const seen = Date.parse(device.lastSeenAt);
  return Number.isFinite(seen) && now - seen < HEARTBEAT_FRESH_MS;
}

export function assertDeviceOwner(
  device: Pick<Device, 'userId'>,
  callerUserId: string,
): void {
  if (device.userId !== callerUserId) {
    throw new ForbiddenError('device does not belong to caller');
  }
}

const ALLOWED_KINDS: ReadonlySet<DeviceKind> = new Set([
  'web',
  'mobile',
  'desktop',
  'cli',
  'worker',
  'agent',
  'integration',
]);

export function isAllowedKind(kind: string): kind is DeviceKind {
  return ALLOWED_KINDS.has(kind as DeviceKind);
}
