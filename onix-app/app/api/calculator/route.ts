import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { inputs, metrics } = body;

  const prompt = `You are a senior M&A advisor. Analyze this acquisition and provide a structured assessment.

## Deal Inputs
- Target Company Revenue: ${inputs.revenue || '—'}
- Target EBITDA: ${inputs.ebitda || '—'}
- EBITDA Margin: ${metrics.ebitdaMargin}%
- Asking / Enterprise Value: ${inputs.askingPrice || '—'}
- EV/EBITDA Multiple: ${metrics.evEbitda}x
- Revenue Multiple: ${metrics.evRevenue}x

## Deal Structure
- Cash Consideration: ${inputs.cashPct}%
- Stock/Equity: ${inputs.equityPct}%
- Earnout: ${inputs.earnoutPct}%

## Financing
- Debt Financing: ${inputs.debtPct}% at ${inputs.interestRate}% interest
- Equity Invested: ${inputs.equityPct}% of deal
- Annual Debt Service: ${metrics.annualDebtService}
- Debt/EBITDA: ${metrics.debtEbitda}x

## Returns (5-year horizon)
- Revenue CAGR assumed: ${inputs.revenueCagr}%
- Exit Multiple assumed: ${inputs.exitMultiple}x EV/EBITDA
- Estimated Exit Value: ${metrics.exitValue}
- Estimated IRR: ${metrics.irr}%
- MOIC: ${metrics.moic}x
- Payback Period: ${metrics.paybackYears} years

Provide your response in exactly this JSON format:
{
  "dealScore": <number 0-100>,
  "verdict": "<one of: Strong Buy | Buy | Neutral | Caution | Pass>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<point 1>", "<point 2>", "<point 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"],
  "valuationComment": "<1-2 sentences on whether the multiple is fair>",
  "structureComment": "<1-2 sentences on deal structure>",
  "financingComment": "<1-2 sentences on debt serviceability>"
}`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    response_format: { type: 'json_object' },
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

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
