import { describe, expect, it, beforeEach } from 'vitest';
import {
  validatePluginComponent,
  sandboxPlugin,
  hasCapability,
  logPluginRegistration,
  getPluginRegistrationLog,
  clearPluginRegistrationLog,
  enforceRuleDepth,
  MAX_RULE_DEPTH,
} from '../src/lib/plugin-sandbox';

describe('Plugin Sandbox', () => {
  describe('validatePluginComponent', () => {
    it('rejects null/undefined', () => {
      expect(validatePluginComponent(null).valid).toBe(false);
      expect(validatePluginComponent(undefined).valid).toBe(false);
    });

    it('rejects non-objects', () => {
      expect(validatePluginComponent('string').valid).toBe(false);
      expect(validatePluginComponent(42).valid).toBe(false);
    });

    it('rejects arrays', () => {
      expect(validatePluginComponent([]).valid).toBe(false);
    });

    it('rejects missing type', () => {
      const result = validatePluginComponent({
        renderer: () => null,
        contract: { type: 'x', displayName: 'X' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('type'));
    });

    it('rejects missing renderer', () => {
      const result = validatePluginComponent({
        type: 'test',
        contract: { type: 'test', displayName: 'Test' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('renderer'));
    });

    it('rejects missing contract', () => {
      const result = validatePluginComponent({
        type: 'test',
        renderer: () => null,
      });
      expect(result.valid).toBe(false);
    });

    it('warns about unknown capabilities but remains valid', () => {
      const result = validatePluginComponent({
        type: 'test',
        renderer: () => null,
        contract: { type: 'test', displayName: 'Test' },
        capabilities: ['canRenderUI', 'canDeleteFiles'],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toContainEqual(expect.stringContaining('canDeleteFiles'));
    });

    it('accepts valid plugin', () => {
      const result = validatePluginComponent({
        type: 'test.widget',
        renderer: () => null,
        contract: { type: 'test.widget', displayName: 'Test Widget' },
        capabilities: ['canRenderUI', 'canAccessTheme'],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sandboxPlugin', () => {
    it('freezes the sandboxed plugin object', () => {
      const sandboxed = sandboxPlugin({
        type: 'test',
        renderer: () => null,
        contract: { type: 'test', displayName: 'Test', category: 'Test', props: {} },
        capabilities: ['canRenderUI'],
      });

      expect(sandboxed.frozen).toBe(true);
      expect(Object.isFrozen(sandboxed)).toBe(true);
    });

    it('filters capabilities to allowed set', () => {
      const sandboxed = sandboxPlugin({
        type: 'test',
        renderer: () => null,
        contract: { type: 'test', displayName: 'Test', category: 'Test', props: {} },
        capabilities: ['canRenderUI', 'unknownCap' as never],
      });

      expect(hasCapability(sandboxed, 'canRenderUI')).toBe(true);
      expect(sandboxed.capabilities.size).toBe(1);
    });
  });

  describe('registration log', () => {
    beforeEach(() => {
      clearPluginRegistrationLog();
    });

    it('logs allowed registrations', () => {
      logPluginRegistration('test.widget', 'allowed');
      const log = getPluginRegistrationLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe('test.widget');
      expect(log[0].result).toBe('allowed');
    });

    it('logs rejected registrations with reason', () => {
      logPluginRegistration('bad.widget', 'rejected', 'Missing renderer');
      const log = getPluginRegistrationLog();
      expect(log[0].reason).toBe('Missing renderer');
    });

    it('clears log', () => {
      logPluginRegistration('test', 'allowed');
      clearPluginRegistrationLog();
      expect(getPluginRegistrationLog()).toHaveLength(0);
    });
  });

  describe('enforceRuleDepth', () => {
    it('allows depth within limit', () => {
      expect(() => enforceRuleDepth(MAX_RULE_DEPTH)).not.toThrow();
      expect(() => enforceRuleDepth(1)).not.toThrow();
    });

    it('throws when depth exceeds limit', () => {
      expect(() => enforceRuleDepth(MAX_RULE_DEPTH + 1)).toThrow(/exceeds maximum/);
    });

    it('includes context in error message', () => {
      expect(() => enforceRuleDepth(MAX_RULE_DEPTH + 1, 'condition group')).toThrow(
        /in condition group/,
      );
    });
  });
});
