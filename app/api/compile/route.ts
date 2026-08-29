import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch("https://api.onlinecompiler.io/api/run-code-sync/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "08b221ed744154b9e7eff9c970dc86c0" 
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Backend execution failed", details: error.message }, { status: 500 });
  }
}