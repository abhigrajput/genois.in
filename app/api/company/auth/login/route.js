import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import {
  rateLimit, rateLimitResponse,
  isLockedOut, recordFailedLogin, clearFailedLogins, lockoutResponse,
  LIMITS,
} from '@/lib/rateLimit';
import { csrfCheck, getClientIp } from '@/lib/security';

const LoginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(255),
});

export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  const ip = getClientIp(request);

  const lockout = await isLockedOut(ip);
  if (lockout.locked) return lockoutResponse(lockout.remainingMs);

  if (!await rateLimit(`company_login_${ip}`, LIMITS.auth.max, LIMITS.auth.windowMs)) return rateLimitResponse(60);

  try {
    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || "Validation failed"), 400);
    const { email, password } = parsed.data;

    const supabase = getAdminClient();
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, email, password')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!company) {
      // FIX P7: dummy compare equalizes timing with the wrong-password path so
      // the endpoint doesn't leak which company emails are registered.
      await bcrypt.compare(password, '$2b$12$yqaegrOo1.IpaTnX7Us5u.jMeu5C9pOXAjwlV3IY0zsXcMLjrjz3e');
      await recordFailedLogin(ip);
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, company.password);
    if (!valid) {
      const fail = await recordFailedLogin(ip);
      if (fail.locked) return lockoutResponse(fail.remainingMs);
      return errorResponse('Invalid email or password', 401);
    }

    await clearFailedLogins(ip);

    const token = jwt.sign(
      { companyId: company.id, email: company.email, type: 'company' },
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse({
      token,
      company: { id: company.id, name: company.name, email: company.email },
    });
  } catch (error) {
    console.error('Company login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
