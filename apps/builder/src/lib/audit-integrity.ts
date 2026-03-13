import type { AuditLogEntry } from './config-governance';

/**
 * Compute a hash chain entry for tamper detection in audit logs.
 * Uses a simple string-based hash since we're in a browser environment.
 * Each entry's hash includes the previous entry's hash, forming a chain.
 */

/**
 * Simple non-cryptographic hash for audit chain integrity.
 * Uses djb2 algorithm — fast, deterministic, sufficient for tamper detection.
 */
function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export interface HashedAuditEntry extends AuditLogEntry {
  prevHash: string;
  hash: string;
}

/**
 * Compute the hash for an audit entry given the previous hash.
 */
export function computeAuditHash(entry: AuditLogEntry, prevHash: string): string {
  const payload = `${prevHash}|${entry.id}|${entry.packageId}|${entry.versionId}|${entry.timestamp}|${entry.action}|${entry.summary}`;
  return djb2Hash(payload);
}

/**
 * Create a hashed audit entry by appending chain hash fields.
 */
export function createHashedAuditEntry(
  entry: AuditLogEntry,
  prevHash: string,
): HashedAuditEntry {
  const hash = computeAuditHash(entry, prevHash);
  return {
    ...entry,
    prevHash,
    hash,
  };
}

/**
 * Verify the integrity of an audit log chain.
 * Returns the index of the first tampered entry, or -1 if chain is intact.
 */
export function verifyAuditChain(entries: HashedAuditEntry[]): {
  valid: boolean;
  brokenAtIndex: number;
} {
  if (entries.length === 0) {
    return { valid: true, brokenAtIndex: -1 };
  }

  let prevHash = '';
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const expectedHash = computeAuditHash(entry, prevHash);

    if (entry.prevHash !== prevHash) {
      return { valid: false, brokenAtIndex: i };
    }
    if (entry.hash !== expectedHash) {
      return { valid: false, brokenAtIndex: i };
    }

    prevHash = entry.hash;
  }

  return { valid: true, brokenAtIndex: -1 };
}

/**
 * Get the last hash in the chain (for appending new entries).
 */
export function getLastAuditHash(entries: HashedAuditEntry[]): string {
  if (entries.length === 0) return '';
  return entries[entries.length - 1]!.hash;
}
