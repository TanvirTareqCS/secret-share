import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const passcode = searchParams.get('passcode') || '';

  if (!id) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

  const data: any = await redis.get(id);

  if (!data) {
    return NextResponse.json({ error: 'Secret not found or has expired.' }, { status: 404 });
  }

  if (data.passcode && data.passcode !== passcode) {
    return NextResponse.json({ requiresPasscode: true }, { status: 401 });
  }

  return NextResponse.json({ text: data.text }, { status: 200 });
}