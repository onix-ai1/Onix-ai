import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { inputs, valuations } = await req.json();

  const prompt = `You are a senior M&A advisor and investment banker. Analyze this business and provide a comprehensive valuation and buyer/investor matchmaking report.

## Business Profile
- Company Name: ${inputs.companyName || 'Unnamed Business'}
- Sector: ${inputs.sector}
- Location: ${inputs.location}
- Business Stage: ${inputs.stage}
- Deal Type: ${inputs.dealType}
- Description: ${inputs.description}

## Financials
- Annual Revenue: ${inputs.revenue}
- EBITDA: ${inputs.ebitda}
- Net Profit: ${inputs.netProfit}
- Revenue Growth (YoY): ${inputs.revenueGrowth}%
- Years in Operation: ${inputs.yearsOp}

## Computed Valuations
- EBITDA Multiple Method: ${valuations.ebitdaVal}
- Revenue Multiple Method: ${valuations.revenueVal}
- DCF Method (simplified): ${valuations.dcfVal}
- Weighted Average Valuation: ${valuations.weightedVal}
- Valuation Range: ${valuations.rangeLow} – ${valuations.rangeHigh}

## Owner's Ask
- Asking Price: ${inputs.askingPrice || 'Not specified'}
- Reason for Sale / Capital Raise: ${inputs.saleReason}

Respond ONLY with this JSON (no markdown):
{
  "valuationScore": <0-100, how fairly priced vs computed value>,
  "valuationVerdict": "<Undervalued | Fair Value | Slightly Overpriced | Overpriced>",
  "valuationSummary": "<2-3 sentences on overall valuation quality>",
  "bestMethod": "<which valuation method is most appropriate for this business and why — 1-2 sentences>",
  "fairValueRange": "<your own assessed fair value range as a string>",

  "matchScore": <0-100, how attractive this business is to buyers/investors>,
  "matchVerdict": "<Highly Attractive | Attractive | Moderate | Difficult to Place | Hard Pass>",
  "matchSummary": "<2-3 sentences on marketability and buyer interest>",

  "idealBuyerProfiles": [
    { "type": "<buyer type e.g. Strategic Acquirer>", "why": "<why this buyer type fits — 1 sentence>", "fit": <0-100> },
    { "type": "<buyer type>", "why": "<reason>", "fit": <0-100> },
    { "type": "<buyer type>", "why": "<reason>", "fit": <0-100> }
  ],

  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "valueDrivers": ["<what will maximize the price — point 1>", "<point 2>", "<point 3>"],
  "redFlags": ["<red flag 1>", "<red flag 2>"],
  "preExitSteps": ["<what to do before going to market — step 1>", "<step 2>", "<step 3>"]
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
