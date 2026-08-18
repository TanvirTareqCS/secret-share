import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Connect to your Upstash database using the keys in .env.local
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    // Get the text and passcode from the frontend
    const body = await request.json();
    const { text, passcode } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Generate a short, random ID for the share link (e.g., "b4f2c9")
    const id = crypto.randomUUID().split('-')[0];

    const dataToSave = {
      text,
      passcode: passcode || null, 
    };

    // Save to Redis with a 600-second (10 minute) expiration timer
    await redis.set(id, dataToSave, { ex: 600 });

    // Send the ID back to the frontend
    return NextResponse.json({ success: true, id }, { status: 200 });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}