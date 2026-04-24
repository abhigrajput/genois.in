import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '@/lib/domainsData';
import { successResponse } from '@/lib/response';

export async function GET() {
  return successResponse({ domains: ALL_DOMAINS, categories: DOMAIN_CATEGORIES });
}
