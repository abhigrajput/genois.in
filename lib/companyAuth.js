import jwt from 'jsonwebtoken';
import { isBlacklisted } from '@/lib/jwtBlacklist';

// FIX P5: mirror the user secret resolution. Company tokens are SIGNED with
// `JWT_SECRET || NEXTAUTH_SECRET`, so verifying with only JWT_SECRET silently
// rejected every token whenever JWT_SECRET was unset. Use the same fallback.
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

export async function getCompanyFromRequest(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    if (!token || !JWT_SECRET) return null;

    // FIX P5: honor logout / revocation for company tokens too (was skipped).
    if (await isBlacklisted(token)) return null;

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'company') return null;
    return payload;
  } catch {
    return null;
  }
}
