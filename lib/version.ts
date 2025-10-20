import packageJson from '@/package.json';

/**
 * Get the current application version from package.json
 * This is evaluated at build time, so the version is always in sync
 */
export function getVersion(): string {
  return packageJson.version;
}

/**
 * Get formatted version string with optional prefix
 */
export function getVersionString(prefix = 'v'): string {
  return `${prefix}${getVersion()}`;
}
