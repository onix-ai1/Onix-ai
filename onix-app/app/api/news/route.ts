import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '';
const BASE_URL    = 'https://newsapi.org/v2/everything';

const MA_FILTER = '(merger OR acquisition OR "M&A" OR buyout OR takeover OR divestiture OR "deal closed" OR "acquisition agreement")';

const CATEGORY_QUERIES: Record<string, string> = {
  all:        MA_FILTER,
  deals:      `(merger OR acquisition OR buyout OR takeover OR divestiture) AND (deal OR agreement OR signed OR completed)`,
  pe:         `("private equity" OR "venture capital" OR "PE firm") AND (acquisition OR buyout OR investment OR portfolio)`,
  ipo:        `("IPO" OR "initial public offering" OR "stock listing" OR "goes public") AND (merger OR acquisition OR M&A OR valuation)`,
  regulatory: `(antitrust OR regulatory OR "SEBI" OR "SEC" OR "CCI" OR "FTC") AND (merger OR acquisition OR blocked OR approved OR deal)`,
  india:      `(India OR Indian OR "BSE" OR "NSE" OR "SEBI") AND (merger OR acquisition OR "M&A" OR buyout OR takeover)`,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'all';
  const search   = searchParams.get('q') || '';
  const page     = searchParams.get('page') || '1';

  const q = search
    ? `(${search}) AND (merger OR acquisition OR "M&A" OR buyout OR takeover OR divestiture)`
    : CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

  if (!NEWSAPI_KEY) {
    return NextResponse.json({ error: 'NEWSAPI_KEY not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    q,
    sortBy:   'publishedAt',
    language: 'en',
    pageSize: '20',
    page,
    apiKey:   NEWSAPI_KEY,
  });

  try {
    const res  = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();

    if (data.status !== 'ok') {
      return NextResponse.json({ error: data.message || 'NewsAPI error' }, { status: 500 });
    }

    return NextResponse.json({
      articles:   data.articles,
      totalResults: data.totalResults,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
