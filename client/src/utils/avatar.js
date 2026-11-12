import { AVATAR_CSS_VARS } from './constants';

/** Deterministic avatar color for a name (same name = same color). */
export function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AVATAR_CSS_VARS[hash % AVATAR_CSS_VARS.length];
}

/** Initials for avatar fallbacks. */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

/** Resolves an avatar path (relative) against the API origin when needed. */
export function avatarSrc(url) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = import.meta.env.VITE_API_ORIGIN || '';
  return `${base}${url}`;
}
