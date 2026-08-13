import { NextResponse } from 'next/server';

/**
 * RETIRED. This endpoint read the `analytics` table, which the app never
 * writes — so it returned an empty graph on every call, for every user.
 * /api/analytics/insights is the live replacement: it reads the tables the
 * app actually writes (see the note at the top of that route).
 *
 * The file is kept, rather than deleted, so a stale client gets a explicit
 * "this is gone" instead of a 404 that reads like a routing bug. There are no
 * callers as of this change — the lib/api.js declaration was removed with it.
 */
export async function GET() {
  return NextResponse.json(
    { success: false, available: false, reason: 'endpoint_retired', message: 'This endpoint has been retired. Use /api/analytics/insights.' },
    { status: 503 }
  );
}
