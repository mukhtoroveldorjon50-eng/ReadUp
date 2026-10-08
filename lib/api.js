import { NextResponse } from 'next/server';

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });
export const unauthorized = () => fail('Please sign in.', 401);

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
