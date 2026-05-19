import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return errorResponse('Email and password required', 400);

    const supabase = getAdminClient();
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!company) return errorResponse('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return errorResponse('Invalid email or password', 401);

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
    return errorResponse('Internal server error', 500);
  }
}
