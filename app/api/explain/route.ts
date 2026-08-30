import { NextResponse } from 'next/server';

const PROMPTS: Record<string, string> = {
  ADIB: "Explain this code in very simple Bengali script, as if teaching a beginner. Break down the logic step-by-step in native Bengali.",
  FABIHA: "Explain this code in extremely simple, easy-to-understand English without using heavy technical jargon.",
  MAHATAB: "Give a highly concise, 2-sentence summary of exactly what this code does. Be direct.",
  MAHIN: "Over-explain the absolute most basic concepts of this code in massive detail, treating the reader like they have never seen code before."
};

export async function POST(req: Request) {
  try {
    const { code, mode } = await req.json();
    const systemPrompt = PROMPTS[mode] || PROMPTS.FABIHA;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Using the highly capable 120B model available on the Developer Plan
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the code:\n\n${code}` }
        ],
        temperature: 0.7,
      })
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return NextResponse.json({ explanation: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}