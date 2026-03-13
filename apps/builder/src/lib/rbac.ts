export type BuilderRole = 'viewer' | 'editor' | 'reviewer' | 'admin';

export type BuilderPermission =
  | 'view'
  | 'edit.layout'
  | 'edit.flow'
  | 'edit.config'
  | 'config.save'
  | 'config.promote'
  | 'config.approve'
  | 'config.reject'
  | 'config.publish'
  | 'config.create'
  | 'bundle.export'
  | 'bundle.import'
  | 'plugin.manage'
  | 'theme.manage';

const ROLE_PERMISSIONS: Record<BuilderRole, readonly BuilderPermission[]> = {
  viewer: ['view', 'bundle.export'],
  editor: [
    'view', 'edit.layout', 'edit.flow', 'edit.config',
    'config.save', 'config.promote', 'config.create',
    'bundle.export', 'bundle.import',
  ],
  reviewer: [
    'view', 'edit.layout', 'edit.flow', 'edit.config',
    'config.save', 'config.promote', 'config.approve', 'config.reject', 'config.create',
    'bundle.export', 'bundle.import',
  ],
  admin: [
    'view', 'edit.layout', 'edit.flow', 'edit.config',
    'config.save', 'config.promote', 'config.approve', 'config.reject', 'config.publish', 'config.create',
    'bundle.export', 'bundle.import', 'plugin.manage', 'theme.manage',
  ],
};

export function hasPermission(role: BuilderRole, permission: BuilderPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: BuilderRole): readonly BuilderPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getAllRoles(): BuilderRole[] {
  return ['viewer', 'editor', 'reviewer', 'admin'];
}

export interface BuilderUser {
  id: string;
  displayName: string;
  role: BuilderRole;
}

export function createBuilderUser(id: string, displayName: string, role: BuilderRole): BuilderUser {
  return { id, displayName, role };
}

export function canPerformAction(user: BuilderUser, permission: BuilderPermission): boolean {
  return hasPermission(user.role, permission);
}
