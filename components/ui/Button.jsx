'use client';
import Link from 'next/link';
import cx from './cx';

const VARIANTS = {
  primary:   'gx-btn--primary',
  secondary: 'gx-btn--secondary',
  outline:   'gx-btn--outline',
  ghost:     'gx-btn--ghost',
  danger:    'gx-btn--danger',
};

const SIZES = { sm: 'gx-btn--sm', md: '', lg: 'gx-btn--lg' };

/**
 * Flat button. Renders a <button>, a next/link, or an <a> depending on props:
 *   <Button onClick={…}>            → button
 *   <Button href="/roadmap">        → Link  (internal)
 *   <Button href="https://…">       → a     (external, opens in a new tab)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  href,
  external,
  children,
  ...rest
}) {
  const cls = cx('gx-btn', VARIANTS[variant] || VARIANTS.primary, SIZES[size], block && 'gx-btn--block', className);

  if (href) {
    const isExternal = external ?? /^(https?:)?\/\//.test(href);
    if (isExternal) {
      return (
        <a className={cls} href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return <Link className={cls} href={href} {...rest}>{children}</Link>;
  }

  return <button className={cls} type={rest.type || 'button'} {...rest}>{children}</button>;
}
