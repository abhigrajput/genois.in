'use client';
import { useId } from 'react';
import cx from './cx';

/** Bare input. Pair with <Field> when it needs a label, hint, or error. */
export function Input({ invalid = false, className, ...rest }) {
  return <input className={cx('gx-input', invalid && 'gx-input--invalid', className)} {...rest} />;
}

export function Textarea({ invalid = false, className, ...rest }) {
  return <textarea className={cx('gx-input', invalid && 'gx-input--invalid', className)} {...rest} />;
}

export function Select({ invalid = false, className, children, ...rest }) {
  return (
    <select className={cx('gx-input', invalid && 'gx-input--invalid', className)} {...rest}>
      {children}
    </select>
  );
}

export function Label({ className, children, ...rest }) {
  return <label className={cx('gx-label', className)} {...rest}>{children}</label>;
}

/**
 * Label + control + hint/error, wired together for screen readers.
 * `children` is a render prop receiving the id/aria props to spread on the control.
 */
export function Field({ label, hint, error, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, invalid: !!error })}
      {error   && <p className="gx-error" id={`${id}-error`}>{error}</p>}
      {!error && hint && <p className="gx-hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export default Input;
