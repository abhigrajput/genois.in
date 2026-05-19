import { errorResponse } from '@/lib/response';
export async function POST() {
  return errorResponse('Payment system is currently suspended.', 503);
}
export async function GET() {
  return errorResponse('Payment system is currently suspended.', 503);
}
