import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are ONIX AI Co-Pilot, an expert AI assistant specialised in M&A advisory, capital raising, and investment banking.

Your role is to help founders, CFOs, and deal teams:
- Prepare companies for M&A transactions or fundraising
- Analyse deal readiness, valuation, and positioning
- Draft pitch narratives, IM sections, and investor outreach messages
- Advise on deal structure, term sheets, and negotiation strategy
- Explain M&A processes (buy-side, sell-side, private equity, venture)
- Identify the right investor profiles and capital sources
- Review financial models and highlight red flags

Tone: professional, concise, and actionable. Use bullet points for lists. When the user shares deal data, reference it specifically in your advice. If you don't know something specific to their situation, ask a clarifying question rather than guessing.

Always remind users that your output is AI-generated guidance and not a substitute for qualified legal, financial, or accounting advice for high-stakes decisions.`;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, dealContext } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      dealContext?: string;
    };

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepend deal context as a system-level user message if provided
    const systemMessages: { role: 'system'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (dealContext) {
      systemMessages.push({
        role: 'system',
        content: `Here is the user's current deal pipeline context:\n${dealContext}\n\nUse this data to give specific, contextualised advice when relevant.`,
      });
    }

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [...systemMessages, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Stream the response as Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Internal server error';
    // Surface a clean message for common OpenAI quota/auth errors
    let message = raw;
    if (raw.includes('429') || raw.toLowerCase().includes('quota')) {
      message = 'OpenAI quota exceeded. Please add billing credits at platform.openai.com/settings/billing, then try again.';
    } else if (raw.includes('401') || raw.toLowerCase().includes('api key')) {
      message = 'Invalid OpenAI API key. Please check your configuration.';
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
