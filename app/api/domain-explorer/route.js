import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '@/lib/domainsData';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET() {
  try {
    return successResponse({ domains: ALL_DOMAINS, categories: DOMAIN_CATEGORIES });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
