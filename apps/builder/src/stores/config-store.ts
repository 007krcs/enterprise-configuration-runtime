import { create } from 'zustand';
import type { ApplicationBundle, ApplicationBundleStatus } from '@platform/schema';
import type { ComponentContract } from '@platform/component-contract';
import {
  createConfigPackage,
  createDraftVersion,
  getActivePackage,
  getActiveVersion,
  getLatestVersion,
  loadConfigStore,
  persistConfigStore,
  recordAuditEntry,
  saveDraftVersion,
  setActiveVersion as setActiveVersionInStore,
  updateVersionStatus,
  type AuditLogEntry,
  type ConfigStoreState,
} from '../lib/config-governance';
import { validateApplicationBundle } from '../lib/bundle-validator';
import { checkFileSize, validateBundleStructure } from '../lib/bundle-import-guard';

const DEFAULT_CONFIG_ID = 'ruleflow-builder-config';
const DEFAULT_TENANT_ID = 'tenant-default';
const DEFAULT_ACTOR = 'builder@local';

let auditIdCounter = 0;
function createAuditId(): string {
  return `audit-${Date.now()}-${++auditIdCounter}`;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 500;

export interface ConfigStoreSlice {
  configStore: ConfigStoreState;
  bundleConfigId: string;
  bundleTenantId: string;
  bundleStatus: ApplicationBundleStatus;
  bundleVersion: number;
  bundleCreatedAt: string;
  bundleUpdatedAt: string;
  configMessage: string | null;
  importMessage: string | null;
  newConfigId: string;
  newConfigName: string;
  newConfigTenantId: string;
}

export interface ConfigStoreActions {
  setBundleConfigId: (value: string) => void;
  setBundleTenantId: (value: string) => void;
  setBundleStatus: (value: ApplicationBundleStatus) => void;
  setBundleVersion: (value: number) => void;
  setBundleCreatedAt: (value: string) => void;
  setBundleUpdatedAt: (value: string) => void;
  setConfigMessage: (value: string | null) => void;
  setImportMessage: (value: string | null) => void;
  setNewConfigId: (value: string) => void;
  setNewConfigName: (value: string) => void;
  setNewConfigTenantId: (value: string) => void;

  commitConfigStore: (nextState: ConfigStoreState) => void;
  debouncedPersist: (state: ConfigStoreState) => void;

  getActivePackage: () => ReturnType<typeof getActivePackage>;
  getActiveVersion: () => ReturnType<typeof getActiveVersion>;

  buildAuditEntry: (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'packageId' | 'versionId'> &
      Partial<Pick<AuditLogEntry, 'packageId' | 'versionId'>>,
  ) => AuditLogEntry;

  pushAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'packageId' | 'versionId'>) => void;

  handleCreateConfig: (applicationBundle: ApplicationBundle, validationErrors: { severity: string }[]) => void;
  handlePackageSelect: (packageId: string) => void;
  handleVersionSelect: (versionId: string) => void;
  handleSaveDraft: (applicationBundle: ApplicationBundle, validationErrors: { severity: string }[]) => void;
  handleCreateDraft: (applicationBundle: ApplicationBundle, validationErrors: { severity: string }[]) => void;
  handlePromote: (validationErrors: { severity: string }[]) => void;
  handleApprove: (validationErrors: { severity: string }[]) => void;
  handleReject: () => void;
  handlePublish: (validationErrors: { severity: string }[]) => void;
  handleImportBundle: (
    file: File,
    componentContracts: ComponentContract[],
    developmentMode: boolean,
    skipValidationInDev: boolean,
  ) => Promise<void>;

  syncFromActiveVersion: () => { bundle: ApplicationBundle } | null;

  canSaveDraft: () => boolean;
  canPromote: () => boolean;
  canApprove: () => boolean;
  canReject: () => boolean;
  canPublish: () => boolean;
  canCreateDraft: () => boolean;

  getPackageOptions: () => { value: string; label: string }[];
  getVersionOptions: () => { value: string; label: string }[];
  getRecentAuditEntries: () => AuditLogEntry[];
}

export function createConfigStore(initialConfigStore: ConfigStoreState) {
  return create<ConfigStoreSlice & ConfigStoreActions>()((set, get) => {
    const pkg = getActivePackage(initialConfigStore);
    const ver = getActiveVersion(initialConfigStore);

    return {
      configStore: initialConfigStore,
      bundleConfigId: pkg?.id ?? DEFAULT_CONFIG_ID,
      bundleTenantId: pkg?.tenantId ?? DEFAULT_TENANT_ID,
      bundleStatus: ver?.status ?? 'DRAFT',
      bundleVersion: ver?.version ?? 1,
      bundleCreatedAt: ver?.createdAt ?? new Date().toISOString(),
      bundleUpdatedAt: ver?.updatedAt ?? new Date().toISOString(),
      configMessage: null,
      importMessage: null,
      newConfigId: '',
      newConfigName: '',
      newConfigTenantId: DEFAULT_TENANT_ID,

      setBundleConfigId: (value) => set({ bundleConfigId: value }),
      setBundleTenantId: (value) => set({ bundleTenantId: value }),
      setBundleStatus: (value) => set({ bundleStatus: value }),
      setBundleVersion: (value) => set({ bundleVersion: value }),
      setBundleCreatedAt: (value) => set({ bundleCreatedAt: value }),
      setBundleUpdatedAt: (value) => set({ bundleUpdatedAt: value }),
      setConfigMessage: (value) => set({ configMessage: value }),
      setImportMessage: (value) => set({ importMessage: value }),
      setNewConfigId: (value) => set({ newConfigId: value }),
      setNewConfigName: (value) => set({ newConfigName: value }),
      setNewConfigTenantId: (value) => set({ newConfigTenantId: value }),

      debouncedPersist: (state) => {
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
          const result = persistConfigStore(state);
          if (!result.ok) {
            set({ configMessage: result.error ?? 'Failed to save config store.' });
          }
        }, PERSIST_DEBOUNCE_MS);
      },

      commitConfigStore: (nextState) => {
        set({ configStore: nextState });
        get().debouncedPersist(nextState);
      },

      getActivePackage: () => getActivePackage(get().configStore),
      getActiveVersion: () => getActiveVersion(get().configStore),

      buildAuditEntry: (entry) => {
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        return {
          id: createAuditId(),
          packageId: entry.packageId ?? activePkg?.id ?? get().bundleConfigId,
          versionId: entry.versionId ?? activeVer?.id ?? 'unknown',
          timestamp: new Date().toISOString(),
          actor: entry.actor ?? DEFAULT_ACTOR,
          action: entry.action,
          summary: entry.summary,
          metadata: entry.metadata,
        };
      },

      pushAuditEntry: (entry) => {
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        const ae = get().buildAuditEntry(entry);
        const next = recordAuditEntry(get().configStore, ae);
        get().commitConfigStore(next);
      },

      handleCreateConfig: (applicationBundle, validationErrors) => {
        set({ configMessage: null });
        const { newConfigId, newConfigTenantId, newConfigName, configStore } = get();
        const trimmedId = newConfigId.trim();
        if (!trimmedId) { set({ configMessage: 'Config ID is required.' }); return; }
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before creating a config.` });
          return;
        }
        const trimmedTenant = newConfigTenantId.trim() || DEFAULT_TENANT_ID;
        const result = createConfigPackage(configStore, {
          id: trimmedId,
          name: newConfigName.trim() || trimmedId,
          tenantId: trimmedTenant,
          bundle: applicationBundle,
          actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: trimmedId,
          versionId: result.value.version.id,
          action: 'config.create',
          summary: `Created config ${trimmedId} (v${result.value.version.version})`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ newConfigId: '', newConfigName: '', newConfigTenantId: trimmedTenant });
      },

      handlePackageSelect: (packageId) => {
        const { configStore } = get();
        const pkg = configStore.packages.find((p) => p.id === packageId);
        if (!pkg) return;
        const latest = getLatestVersion(pkg) ?? pkg.versions[0];
        if (!latest) return;
        get().commitConfigStore(setActiveVersionInStore(configStore, pkg.id, latest.id));
      },

      handleVersionSelect: (versionId) => {
        const activePkg = get().getActivePackage();
        if (!activePkg) return;
        get().commitConfigStore(setActiveVersionInStore(get().configStore, activePkg.id, versionId));
      },

      handleSaveDraft: (applicationBundle, validationErrors) => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        if (!get().canSaveDraft()) {
          set({ configMessage: 'Only draft or rejected versions can be saved.' });
          return;
        }
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before saving.` });
          return;
        }
        const result = saveDraftVersion(get().configStore, {
          packageId: activePkg.id,
          versionId: activeVer.id,
          bundle: applicationBundle,
          actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id,
          versionId: result.value.id,
          action: 'version.save',
          summary: `Saved draft v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ bundleUpdatedAt: result.value.updatedAt, bundleStatus: result.value.status });
      },

      handleCreateDraft: (applicationBundle, validationErrors) => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        if (!activePkg) return;
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before creating a draft.` });
          return;
        }
        const result = createDraftVersion(get().configStore, {
          packageId: activePkg.id,
          bundle: applicationBundle,
          actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id,
          versionId: result.value.id,
          action: 'version.create',
          summary: `Created draft v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({
          bundleVersion: result.value.version,
          bundleStatus: result.value.status,
          bundleCreatedAt: result.value.createdAt,
          bundleUpdatedAt: result.value.updatedAt,
        });
      },

      handlePromote: (validationErrors) => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        if (!get().canPromote()) { set({ configMessage: 'Only drafts can be submitted.' }); return; }
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before promoting.` });
          return;
        }
        const result = updateVersionStatus(get().configStore, {
          packageId: activePkg.id, versionId: activeVer.id, status: 'SUBMITTED', actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id, versionId: result.value.id,
          action: 'version.promote', summary: `Submitted v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ bundleStatus: result.value.status, bundleUpdatedAt: result.value.updatedAt });
      },

      handleApprove: (validationErrors) => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        if (!get().canApprove()) { set({ configMessage: 'Only submitted versions can be approved.' }); return; }
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before approving.` });
          return;
        }
        const result = updateVersionStatus(get().configStore, {
          packageId: activePkg.id, versionId: activeVer.id, status: 'APPROVED', actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id, versionId: result.value.id,
          action: 'version.approve', summary: `Approved v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ bundleStatus: result.value.status, bundleUpdatedAt: result.value.updatedAt });
      },

      handleReject: () => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        if (!get().canReject()) { set({ configMessage: 'Only submitted versions can be rejected.' }); return; }
        const result = updateVersionStatus(get().configStore, {
          packageId: activePkg.id, versionId: activeVer.id, status: 'REJECTED', actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id, versionId: result.value.id,
          action: 'version.reject', summary: `Rejected v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ bundleStatus: result.value.status, bundleUpdatedAt: result.value.updatedAt });
      },

      handlePublish: (validationErrors) => {
        set({ configMessage: null });
        const activePkg = get().getActivePackage();
        const activeVer = get().getActiveVersion();
        if (!activePkg || !activeVer) return;
        if (!get().canPublish()) { set({ configMessage: 'Only approved versions can be published.' }); return; }
        if (validationErrors.length > 0) {
          set({ configMessage: `Fix ${validationErrors.length} validation errors before publishing.` });
          return;
        }
        const result = updateVersionStatus(get().configStore, {
          packageId: activePkg.id, versionId: activeVer.id, status: 'PUBLISHED', actor: DEFAULT_ACTOR,
        });
        if (!result.ok) { set({ configMessage: result.error }); return; }
        const ae = get().buildAuditEntry({
          packageId: activePkg.id, versionId: result.value.id,
          action: 'version.publish', summary: `Published v${result.value.version}`,
        });
        get().commitConfigStore(recordAuditEntry(result.state, ae));
        set({ bundleStatus: result.value.status, bundleUpdatedAt: result.value.updatedAt });
      },

      handleImportBundle: async (file, componentContracts, developmentMode, skipValidationInDev) => {
        set({ importMessage: null, configMessage: null });
        try {
          const sizeError = checkFileSize(file);
          if (sizeError) { set({ importMessage: sizeError }); return; }
          const text = await file.text();
          let parsed: unknown;
          try { parsed = JSON.parse(text); } catch { set({ importMessage: 'File does not contain valid JSON.' }); return; }
          const guard = validateBundleStructure(parsed);
          if (!guard.ok) { set({ importMessage: guard.error }); return; }
          const bundle = guard.bundle;
          const validation = validateApplicationBundle(bundle, componentContracts, { developmentMode, skipA11yI18nInDev: skipValidationInDev });
          if (validation.issues.some((i) => i.severity === 'error')) {
            set({ importMessage: `Import rejected: ${validation.issues.filter((i) => i.severity === 'error').length} errors found.` });
            return;
          }
          const { configStore } = get();
          const existing = configStore.packages.find((pkg) => pkg.id === bundle.metadata.configId);
          if (!existing) {
            const result = createConfigPackage(configStore, {
              id: bundle.metadata.configId, name: bundle.metadata.configId,
              tenantId: bundle.metadata.tenantId, bundle, actor: DEFAULT_ACTOR,
            });
            if (!result.ok) { set({ importMessage: result.error }); return; }
            const ae = get().buildAuditEntry({
              packageId: bundle.metadata.configId, versionId: result.value.version.id,
              action: 'bundle.import', summary: `Imported new config ${bundle.metadata.configId}`,
            });
            get().commitConfigStore(recordAuditEntry(result.state, ae));
            set({ importMessage: `Imported ${bundle.metadata.configId} as a new config.` });
            return;
          }
          const draftResult = createDraftVersion(configStore, { packageId: existing.id, bundle, actor: DEFAULT_ACTOR });
          if (!draftResult.ok) { set({ importMessage: draftResult.error }); return; }
          const ae = get().buildAuditEntry({
            packageId: existing.id, versionId: draftResult.value.id,
            action: 'bundle.import', summary: `Imported bundle as v${draftResult.value.version}`,
          });
          get().commitConfigStore(recordAuditEntry(draftResult.state, ae));
          set({ importMessage: `Imported bundle as draft v${draftResult.value.version}.` });
        } catch (err) {
          set({ importMessage: err instanceof Error ? `Import failed: ${err.message}` : 'Import failed unexpectedly.' });
        }
      },

      syncFromActiveVersion: () => {
        const { configStore } = get();
        const pkg = getActivePackage(configStore);
        const version = getActiveVersion(configStore);
        if (!pkg || !version) return null;
        set({
          bundleConfigId: pkg.id,
          bundleTenantId: pkg.tenantId,
          bundleStatus: version.status,
          bundleVersion: version.version,
          bundleCreatedAt: version.createdAt,
          bundleUpdatedAt: version.updatedAt,
          newConfigTenantId: pkg.tenantId,
        });
        return { bundle: version.bundle };
      },

      canSaveDraft: () => {
        const v = get().getActiveVersion();
        return v?.status === 'DRAFT' || v?.status === 'REJECTED';
      },
      canPromote: () => {
        const v = get().getActiveVersion();
        return v?.status === 'DRAFT' || v?.status === 'REJECTED';
      },
      canApprove: () => get().getActiveVersion()?.status === 'SUBMITTED',
      canReject: () => get().getActiveVersion()?.status === 'SUBMITTED',
      canPublish: () => get().getActiveVersion()?.status === 'APPROVED',
      canCreateDraft: () => {
        const s = get().getActiveVersion()?.status;
        return s === 'APPROVED' || s === 'PUBLISHED' || s === 'ARCHIVED';
      },

      getPackageOptions: () =>
        get().configStore.packages.map((pkg) => ({ value: pkg.id, label: `${pkg.name} (${pkg.id})` })),

      getVersionOptions: () => {
        const activePkg = get().getActivePackage();
        if (!activePkg) return [];
        return [...activePkg.versions]
          .sort((a, b) => b.version - a.version)
          .map((v) => ({ value: v.id, label: `v${v.version} · ${v.status}` }));
      },

      getRecentAuditEntries: () => {
        const { configStore } = get();
        const activePkg = get().getActivePackage();
        const entries = activePkg
          ? configStore.audit.filter((e) => e.packageId === activePkg.id)
          : configStore.audit;
        return entries.slice(-8).reverse();
      },
    };
  });
}

export type ConfigStore = ReturnType<typeof createConfigStore>;
