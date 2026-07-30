/**
 * GENOIS light design-system primitives.
 *
 * Visual rules live in `app/design-tokens.css` as `.gx-*` classes; these
 * components are thin wrappers that pick the right class. Layout (grid, flex,
 * width) stays with the caller — Tailwind utilities or inline styles are fine
 * — but colour, type, radius, and elevation come from here so they stay
 * consistent.
 *
 * NOTE: the older `ErrorCard` / `LoadingSkeleton` in this folder are still
 * dark-themed and still used by un-migrated pages. They are deliberately not
 * re-exported here.
 */
export { default as cx } from './cx';
export { default as Button } from './Button';
export { default as Card, CardHeader, CardBody, CardFooter, CardTitle, SectionLabel } from './Card';
export { default as Input, Textarea, Select, Label, Field } from './Input';
export { default as Badge, DifficultyBadge } from './Badge';
export { default as Stat, Progress } from './Stat';
export { default as Skeleton, SkeletonText } from './Skeleton';
