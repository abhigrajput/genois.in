'use client';
import cx from './cx';

/**
 * Light-theme placeholder. A quiet opacity pulse rather than a sweeping
 * shimmer — loading states should not be the liveliest thing on the page.
 *
 * Distinct from the legacy `LoadingSkeleton` in this folder, which is still
 * dark-themed and still used by the un-migrated pages.
 */
export default function Skeleton({ h = 16, w = '100%', radius, className, style, ...rest }) {
  return (
    <div
      className={cx('gx-skeleton', className)}
      style={{ height: h, width: w, borderRadius: radius, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

/** N stacked lines, the last one short — reads as a paragraph. */
export function SkeletonText({ lines = 3, h = 14, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} h={h} w={i === lines - 1 ? '65%' : '100%'} />
      ))}
    </div>
  );
}
