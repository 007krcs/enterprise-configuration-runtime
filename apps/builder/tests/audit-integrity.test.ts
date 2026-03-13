import { describe, expect, it } from 'vitest';
import {
  computeAuditHash,
  createHashedAuditEntry,
  verifyAuditChain,
  getLastAuditHash,
  type HashedAuditEntry,
} from '../src/lib/audit-integrity';
import type { AuditLogEntry } from '../src/lib/config-governance';

function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'audit-1',
    packageId: 'pkg-1',
    versionId: 'ver-1',
    timestamp: '2025-01-01T00:00:00Z',
    action: 'CREATED',
    summary: 'Created config',
    ...overrides,
  };
}

describe('Audit Integrity', () => {
  describe('computeAuditHash', () => {
    it('produces deterministic hash', () => {
      const entry = makeEntry();
      const hash1 = computeAuditHash(entry, '');
      const hash2 = computeAuditHash(entry, '');
      expect(hash1).toBe(hash2);
    });

    it('changes when prevHash changes', () => {
      const entry = makeEntry();
      const hash1 = computeAuditHash(entry, '');
      const hash2 = computeAuditHash(entry, 'abc');
      expect(hash1).not.toBe(hash2);
    });

    it('changes when entry content changes', () => {
      const entry1 = makeEntry({ action: 'CREATED' });
      const entry2 = makeEntry({ action: 'PROMOTED' });
      expect(computeAuditHash(entry1, '')).not.toBe(computeAuditHash(entry2, ''));
    });
  });

  describe('createHashedAuditEntry', () => {
    it('adds hash and prevHash fields', () => {
      const entry = makeEntry();
      const hashed = createHashedAuditEntry(entry, '');
      expect(hashed.prevHash).toBe('');
      expect(typeof hashed.hash).toBe('string');
      expect(hashed.hash.length).toBeGreaterThan(0);
    });

    it('preserves original entry fields', () => {
      const entry = makeEntry({ action: 'PROMOTED' });
      const hashed = createHashedAuditEntry(entry, 'prev');
      expect(hashed.action).toBe('PROMOTED');
      expect(hashed.id).toBe('audit-1');
    });
  });

  describe('verifyAuditChain', () => {
    it('returns valid for empty chain', () => {
      expect(verifyAuditChain([])).toEqual({ valid: true, brokenAtIndex: -1 });
    });

    it('returns valid for single entry chain', () => {
      const entry = createHashedAuditEntry(makeEntry(), '');
      expect(verifyAuditChain([entry])).toEqual({ valid: true, brokenAtIndex: -1 });
    });

    it('returns valid for multi-entry chain', () => {
      const e1 = createHashedAuditEntry(makeEntry({ id: 'a1' }), '');
      const e2 = createHashedAuditEntry(makeEntry({ id: 'a2' }), e1.hash);
      const e3 = createHashedAuditEntry(makeEntry({ id: 'a3' }), e2.hash);
      expect(verifyAuditChain([e1, e2, e3])).toEqual({ valid: true, brokenAtIndex: -1 });
    });

    it('detects tampered entry', () => {
      const e1 = createHashedAuditEntry(makeEntry({ id: 'a1' }), '');
      const e2 = createHashedAuditEntry(makeEntry({ id: 'a2' }), e1.hash);
      const tampered: HashedAuditEntry = { ...e2, summary: 'TAMPERED' };
      expect(verifyAuditChain([e1, tampered]).valid).toBe(false);
      expect(verifyAuditChain([e1, tampered]).brokenAtIndex).toBe(1);
    });

    it('detects broken chain link', () => {
      const e1 = createHashedAuditEntry(makeEntry({ id: 'a1' }), '');
      const e2 = createHashedAuditEntry(makeEntry({ id: 'a2' }), 'wrong-hash');
      expect(verifyAuditChain([e1, e2]).valid).toBe(false);
      expect(verifyAuditChain([e1, e2]).brokenAtIndex).toBe(1);
    });
  });

  describe('getLastAuditHash', () => {
    it('returns empty string for empty chain', () => {
      expect(getLastAuditHash([])).toBe('');
    });

    it('returns last entry hash', () => {
      const e1 = createHashedAuditEntry(makeEntry({ id: 'a1' }), '');
      const e2 = createHashedAuditEntry(makeEntry({ id: 'a2' }), e1.hash);
      expect(getLastAuditHash([e1, e2])).toBe(e2.hash);
    });
  });
});
