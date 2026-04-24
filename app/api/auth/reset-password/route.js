import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return errorResponse('Token and password required', 400);
    if (password.length < 6) return errorResponse('Password must be at least 6 characters', 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!user) return errorResponse('Invalid or expired reset link', 400);

    const expires = new Date(user.reset_token_expires);
    if (expires < new Date()) return errorResponse('Reset link has expired. Request a new one.', 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    await supabase.from('users').update({
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    }).eq('id', user.id);

    return successResponse({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
