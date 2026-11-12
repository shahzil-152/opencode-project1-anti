import { cn } from '@/utils/cn';
import { avatarColor, avatarSrc, initials } from '@/utils/avatar';

const SIZES = {
  xs: 20,
  sm: 24,
  md: 28,
  lg: 36,
  xl: 44,
  xxl: 64,
};

export function Avatar({ user, size = 'md', className, ring = true }) {
  const px = SIZES[size] || SIZES.md;
  const name = user?.name || user?.email || '';
  const src = avatarSrc(user?.avatarUrl);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        style={{ width: px, height: px }}
        className={cn(
          'shrink-0 rounded-full bg-paper-deep object-cover',
          ring && 'ring-1 ring-line',
          className
        )}
      />
    );
  }

  return (
    <span
      style={{ width: px, height: px, backgroundColor: avatarColor(name), fontSize: Math.max(9, px * 0.38) }}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        ring && 'ring-1 ring-black/5',
        className
      )}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
