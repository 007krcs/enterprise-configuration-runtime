import { describe, expect, it } from 'vitest';
import { hasPermission, getPermissions, canPerformAction, createBuilderUser } from '../src/lib/rbac';

describe('RBAC', () => {
  describe('viewer role', () => {
    it('can view', () => {
      expect(hasPermission('viewer', 'view')).toBe(true);
    });

    it('can export bundles', () => {
      expect(hasPermission('viewer', 'bundle.export')).toBe(true);
    });

    it('cannot edit layout', () => {
      expect(hasPermission('viewer', 'edit.layout')).toBe(false);
    });

    it('cannot approve configs', () => {
      expect(hasPermission('viewer', 'config.approve')).toBe(false);
    });
  });

  describe('editor role', () => {
    it('can edit layout and flow', () => {
      expect(hasPermission('editor', 'edit.layout')).toBe(true);
      expect(hasPermission('editor', 'edit.flow')).toBe(true);
    });

    it('can save and promote', () => {
      expect(hasPermission('editor', 'config.save')).toBe(true);
      expect(hasPermission('editor', 'config.promote')).toBe(true);
    });

    it('cannot approve or publish', () => {
      expect(hasPermission('editor', 'config.approve')).toBe(false);
      expect(hasPermission('editor', 'config.publish')).toBe(false);
    });
  });

  describe('reviewer role', () => {
    it('can approve and reject', () => {
      expect(hasPermission('reviewer', 'config.approve')).toBe(true);
      expect(hasPermission('reviewer', 'config.reject')).toBe(true);
    });

    it('cannot publish', () => {
      expect(hasPermission('reviewer', 'config.publish')).toBe(false);
    });
  });

  describe('admin role', () => {
    it('can do everything', () => {
      expect(hasPermission('admin', 'config.publish')).toBe(true);
      expect(hasPermission('admin', 'plugin.manage')).toBe(true);
      expect(hasPermission('admin', 'theme.manage')).toBe(true);
    });
  });

  describe('canPerformAction', () => {
    it('checks user role permissions', () => {
      const viewer = createBuilderUser('user-1', 'Alice', 'viewer');
      const admin = createBuilderUser('user-2', 'Bob', 'admin');

      expect(canPerformAction(viewer, 'config.publish')).toBe(false);
      expect(canPerformAction(admin, 'config.publish')).toBe(true);
    });
  });

  describe('getPermissions', () => {
    it('returns all permissions for a role', () => {
      const viewerPerms = getPermissions('viewer');
      expect(viewerPerms).toContain('view');
      expect(viewerPerms).toContain('bundle.export');
      expect(viewerPerms.length).toBe(2);
    });
  });
});
