/** Join class names, dropping falsy values. */
export default function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}
