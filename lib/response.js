import { NextResponse } from 'next/server';

export function successResponse(data, message = 'Success', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(message = 'An error occurred', status = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return NextResponse.json(payload, { status });
}
