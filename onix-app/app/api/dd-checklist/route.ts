import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { dealName, sector, dealType, value } = await req.json();

  const prompt = `Generate a comprehensive M&A due diligence checklist for this deal.

Deal: ${dealName}
Sector: ${sector}
Type: ${dealType}
Value: ${value}

Return ONLY this JSON structure:
{
  "categories": [
    {
      "name": "<category name>",
      "icon": "<single emoji>",
      "items": [
        { "id": "<unique_id>", "text": "<checklist item>", "priority": "<High|Medium|Low>", "done": false }
      ]
    }
  ]
}

Include these categories: Financial, Legal, Commercial, Operational, HR & People, Technology & IP, Tax, Environmental & Regulatory.
Each category should have 5-8 specific, actionable items relevant to the sector. Prioritize items correctly.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return NextResponse.json(JSON.parse(completion.choices[0].message.content || '{}'));
}
