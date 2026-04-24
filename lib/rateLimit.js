const rateLimitMap = new Map();

export function rateLimit(identifier, maxRequests = 20, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  if (!rateLimitMap.has(identifier)) rateLimitMap.set(identifier, []);
  const requests = rateLimitMap.get(identifier).filter(t => t > windowStart);
  requests.push(now);
  rateLimitMap.set(identifier, requests);
  return requests.length <= maxRequests;
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ success: false, message: 'Too many requests. Please slow down.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
