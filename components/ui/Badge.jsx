'use client';
import cx from './cx';

const TONES = {
  neutral: 'gx-badge--neutral',
  accent:  'gx-badge--accent',
  success: 'gx-badge--success',
  warning: 'gx-badge--warning',
  danger:  'gx-badge--danger',
  info:    'gx-badge--info',
  solid:   'gx-badge--solid',
};

/** Difficulty labels map onto the semantic tones, so the palette stays closed. */
const DIFFICULTY_TONE = {
  easy: 'success', beginner: 'success',
  medium: 'warning', intermediate: 'warning',
  hard: 'danger', advanced: 'danger', expert: 'danger',
};

export default function Badge({ tone = 'neutral', pill = false, icon: Icon, className, children, ...rest }) {
  return (
    <span className={cx('gx-badge', TONES[tone] || TONES.neutral, pill && 'gx-badge--pill', className)} {...rest}>
      {Icon && <Icon size={11} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

/** <DifficultyBadge level="Medium" /> */
export function DifficultyBadge({ level, ...rest }) {
  if (!level) return null;
  return <Badge tone={DIFFICULTY_TONE[String(level).toLowerCase()] || 'neutral'} {...rest}>{level}</Badge>;
}
