import jwt from 'jsonwebtoken';

export async function getCompanyFromRequest(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'company') return null;
    return payload;
  } catch {
    return null;
  }
}
