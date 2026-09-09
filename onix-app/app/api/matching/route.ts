import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { mode, query, pool } = await req.json();
  // mode: 'business_to_investors' | 'investor_to_businesses'

  const prompt = mode === 'business_to_investors' ? `
You are a senior M&A matchmaker. A business is looking for buyers/investors. Score and rank each investor candidate.

## Business Profile
${JSON.stringify(query, null, 2)}

## Investor Candidates (score each)
${JSON.stringify(pool, null, 2)}

Return ONLY JSON:
{
  "matches": [
    {
      "id": "<investor id>",
      "name": "<investor name>",
      "fitScore": <0-100>,
      "verdict": "<Strong Match | Good Match | Possible Match | Weak Match>",
      "reason": "<2 sentences why this investor fits this business>",
      "concerns": "<1 sentence on the main risk or mismatch>",
      "suggestedApproach": "<1 sentence on how to approach this investor>"
    }
  ]
}
Sort by fitScore descending. Include all candidates.` : `
You are a senior M&A matchmaker. An investor is looking for acquisition/investment targets. Score and rank each business.

## Investor Profile & Criteria
${JSON.stringify(query, null, 2)}

## Business Candidates (score each)
${JSON.stringify(pool, null, 2)}

Return ONLY JSON:
{
  "matches": [
    {
      "id": "<business listing id>",
      "name": "<company name>",
      "fitScore": <0-100>,
      "verdict": "<Strong Match | Good Match | Possible Match | Weak Match>",
      "reason": "<2 sentences why this business fits the investor criteria>",
      "concerns": "<1 sentence on the main risk or mismatch>",
      "suggestedApproach": "<1 sentence on recommended next step>"
    }
  ]
}
Sort by fitScore descending. Include all candidates.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return NextResponse.json(result);
}
