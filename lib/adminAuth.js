// FIX P6: single source of admin authority. This module previously carried a
// second, divergent getAdminFromRequest (hardcoded email only) that could drift
// from the one in lib/auth.js. It now re-exports the unified implementation, so
// there is exactly one admin check and one ADMIN_EMAILS list in the codebase.
import { ADMIN_EMAILS, getAdminFromRequest } from '@/lib/auth';

export async function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

export { getAdminFromRequest };
