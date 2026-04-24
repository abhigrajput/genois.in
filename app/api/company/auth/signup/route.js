import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { name, email, password, website, size, domainFocus, location, description } = await request.json();

    if (!name || !email || !password) return errorResponse('Name email and password required', 400);
    if (password.length < 6) return errorResponse('Password must be at least 6 characters', 400);

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) return errorResponse('Company with this email already exists', 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: company } = await supabase
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

    const token = jwt.sign(
      { companyId: company.id, email: company.email, type: 'company' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return successResponse({
      token,
      company: { id: company.id, name: company.name, email: company.email },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
