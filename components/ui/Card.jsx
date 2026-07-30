'use client';
import cx from './cx';

/**
 * Card — subtle border, near-invisible shadow, no gradient.
 *
 *   <Card>                      plain
 *   <Card muted>                grey surface
 *   <Card accent>               green border, for the one card that leads
 *   <Card interactive as={..}>  hover affordance
 *
 * Compose with <CardHeader> / <CardBody> / <CardFooter> for the divided
 * layout, or pass `padded` to get a single padded block.
 */
export function Card({
  as: Tag = 'div',
  muted = false,
  accent = false,
  flat = false,
  interactive = false,
  padded = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        'gx-card',
        muted && 'gx-card--muted',
        accent && 'gx-card--accent',
        flat && 'gx-card--flat',
        interactive && 'gx-card--interactive',
        padded && 'gx-card__body',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, ...rest }) {
  return <div className={cx('gx-card__header', className)} {...rest}>{children}</div>;
}

export function CardBody({ className, children, ...rest }) {
  return <div className={cx('gx-card__body', className)} {...rest}>{children}</div>;
}

export function CardFooter({ className, children, ...rest }) {
  return <div className={cx('gx-card__footer', className)} {...rest}>{children}</div>;
}

export function CardTitle({ as: Tag = 'h3', className, children, ...rest }) {
  return <Tag className={cx('gx-card__title', className)} {...rest}>{children}</Tag>;
}

/** Small uppercase label that heads a dense panel. Sans, never mono. */
export function SectionLabel({ icon: Icon, className, children, ...rest }) {
  return (
    <span className={cx('gx-section-label', className)} {...rest}>
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </span>
  );
}

export default Card;
