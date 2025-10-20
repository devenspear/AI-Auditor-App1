import { getVersionString } from '@/lib/version';

interface VersionFooterProps {
  /** Additional text to display before version */
  prefix?: string;
  /** CSS class name for styling */
  className?: string;
}

/**
 * Version Footer Component
 * Automatically displays the current version from package.json
 * Updates automatically when package.json version is bumped
 */
export function VersionFooter({ prefix, className = 'text-xs text-slate-400' }: VersionFooterProps) {
  const versionText = prefix ? `${prefix} ${getVersionString()}` : getVersionString();

  return (
    <p className={className}>
      {versionText}
    </p>
  );
}
