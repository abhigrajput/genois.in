'use client';
import cx from './cx';

/**
 * A single figure in a stats bar: uppercase label, large tabular value,
 * optional meta line underneath.
 *
 *   <Stat label="Score" value="12,480" icon={Zap} meta="+60 today" />
 */
export default function Stat({ label, value, icon: Icon, iconColor, meta, tone, className, children, ...rest }) {
  return (
    <div className={cx('gx-stat', className)} {...rest}>
      <span className="gx-stat__label">{label}</span>
      <span className="gx-stat__value" style={tone ? { color: tone } : undefined}>
        {Icon && <Icon size={20} strokeWidth={2} color={iconColor || tone || 'currentColor'} />}
        {value}
      </span>
      {meta && <span className="gx-stat__meta">{meta}</span>}
      {children}
    </div>
  );
}

/** Flat progress bar. `value` and `max` are plain numbers. */
export function Progress({ value = 0, max = 100, label, className, ...rest }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={cx('gx-progress', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      {...rest}
    >
      <div className="gx-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
