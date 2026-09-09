import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { deal, notes } = await req.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [{
      role: 'user',
      content: `You are an M&A lawyer. Draft a professional non-binding term sheet for this deal.

Deal Details:
${JSON.stringify(deal, null, 2)}

Additional negotiation context:
${notes || 'None provided'}

Write a complete, professional term sheet with these sections:
1. Transaction Overview
2. Purchase Price & Consideration
3. Deal Structure
4. Conditions to Closing
5. Due Diligence Period
6. Exclusivity
7. Representations & Warranties
8. Indemnification
9. Governing Law
10. Expiration

Use formal legal language. Mark key negotiable points with [NEGOTIABLE]. This is a non-binding letter of intent.`
    }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new NextResponse(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
