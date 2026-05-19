import { COMPANIES } from '@/lib/companiesData';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET() {
  try {
    return successResponse({ companies: COMPANIES });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
