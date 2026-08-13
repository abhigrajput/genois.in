import { NextResponse } from 'next/server';

/**
 * RETIRED — same reason as the sibling daily-graph route: it read the
 * `analytics` table, which the app never writes, so every response was empty.
 * /api/analytics/insights is the live replacement.
 */
export async function GET() {
  return NextResponse.json(
    { success: false, available: false, reason: 'endpoint_retired', message: 'This endpoint has been retired. Use /api/analytics/insights.' },
    { status: 503 }
  );
}
