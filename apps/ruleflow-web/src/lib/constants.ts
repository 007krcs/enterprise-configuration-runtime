/**
 * Shared application constants.
 *
 * Centralises magic strings that are used across multiple modules so renaming
 * or refactoring only has to happen in one place.
 */

/** localStorage key prefix used when persisting preview-draft bundles. */
export const PREVIEW_DRAFT_PREFIX = 'ruleflow:preview:draft:';

/** localStorage key for the current project bundle snapshot. */
export const PROJECT_BUNDLE_STORAGE_KEY = 'ecr.currentBundle.v1';

/**
 * Warn the user via console when localStorage usage exceeds this percentage
 * of the estimated quota (5 MB by default in most browsers).
 */
export const STORAGE_QUOTA_WARN_THRESHOLD = 0.8;

/** Estimated localStorage quota in bytes (5 MB). */
export const ESTIMATED_STORAGE_QUOTA = 5 * 1024 * 1024;
