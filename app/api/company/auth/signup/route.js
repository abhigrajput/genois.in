import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck, checkPasswordStrength, getClientIp } from '@/lib/security';

const SignupSchema = z.object({
  name:         z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email:        z.string().email('Invalid email format').max(255),
  password:     z.string().min(8, 'Password must be at least 8 characters').max(128),
  website:      z.string().max(255).optional().nullable(),
  size:         z.enum(['startup', 'small', 'mid', 'large', 'enterprise']).optional(),
  domainFocus:  z.string().max(100).optional().nullable(),
  location:     z.string().max(100).optional().nullable(),
  description:  z.string().max(2000).optional().nullable(),
});

export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  const ip = getClientIp(request);
  if (!await rateLimit(`company_signup_${ip}`, 5, 3600000)) return rateLimitResponse(3600);

  try {
    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || "Validation failed"), 400);
    const { name, email, password, website, size, domainFocus, location, description } = parsed.data;

    const pwdError = checkPasswordStrength(password);
    if (pwdError) return errorResponse(pwdError, 400);

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) return errorResponse('Company with this email already exists', 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: company, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        website: website || null,
        size: size || 'startup',
        domain_focus: domainFocus || null,
        location: location || null,
        description: description || null,
      })
      .select()
      .single();

    if (insertError || !company) {
      console.error('Company signup DB error:', insertError);
      return errorResponse('Account creation failed', 500);
    }

    const token = jwt.sign(
      { companyId: company.id, email: company.email, type: 'company' },
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    return successResponse({
      token,
      company: { id: company.id, name: company.name, email: company.email },
    }, 'Account created successfully', 201);
  } catch (error) {
    console.error('Company signup error:', error);
    return errorResponse('Internal server error', 500);
  }
}
