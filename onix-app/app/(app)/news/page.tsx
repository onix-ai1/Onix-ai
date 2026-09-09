'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = [
  { key: 'all',        label: 'All M&A' },
  { key: 'deals',      label: 'Deals' },
  { key: 'pe',         label: 'PE / VC' },
  { key: 'ipo',        label: 'IPO' },
  { key: 'regulatory', label: 'Regulatory' },
  { key: 'india',      label: 'India' },
];

interface Article {
  title:       string;
  description: string;
  url:         string;
  urlToImage:  string | null;
  publishedAt: string;
  source:      { name: string };
  author:      string | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NewsPage() {
  const [category, setCategory] = useState('all');
  const [search,   setSearch]   = useState('');
  const [query,    setQuery]    = useState('');   // committed search
  const [page,     setPage]     = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const fetchNews = useCallback(async (cat: string, q: string, pg: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ category: cat, page: String(pg) });
      if (q) params.set('q', q);
      const res  = await fetch(`/api/news?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setArticles(data.articles || []);
      setTotal(data.totalResults || 0);
    } catch {
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(category, query, page); }, [category, query, page, fetchNews]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  function switchCategory(cat: string) {
    setCategory(cat);
    setPage(1);
    setQuery('');
    setSearch('');
  }

  const totalPages = Math.ceil(Math.min(total, 100) / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--onix-text)', margin: 0 }}>M&A News</h2>
          <p style={{ fontSize: 13, color: 'var(--onix-muted)', marginTop: 4 }}>
            Live deal intelligence — mergers, acquisitions &amp; market moves
          </p>
        </div>
        <button
          onClick={() => fetchNews(category, query, page)}
          style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--onix-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search M&A news — company, sector, deal type…"
            style={{
              width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, fontSize: 14,
              background: 'var(--onix-card)', border: '1px solid var(--onix-border)',
              color: 'var(--onix-text)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--onix-gold)', color: '#0D0D0D', fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none' }}
        >
          Search
        </button>
      </form>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => switchCategory(c.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: '1px solid',
              borderColor:  category === c.key ? 'var(--onix-gold)'   : 'var(--onix-border)',
              background:   category === c.key ? 'rgba(201,168,76,0.1)' : 'transparent',
              color:        category === c.key ? 'var(--onix-gold)'   : 'var(--onix-muted)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!loading && !error && total > 0 && (
        <p style={{ fontSize: 12, color: 'var(--onix-muted)', marginTop: -8 }}>
          {total.toLocaleString()} articles found · Page {page} of {totalPages}
        </p>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
          ⚠ {error}
          {error.includes('NEWSAPI_KEY') && (
            <span style={{ display: 'block', marginTop: 6, color: 'var(--onix-muted)' }}>
              Add your <strong>NEWSAPI_KEY</strong> to <code>.env.local</code> — get a free key at newsapi.org
            </span>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, padding: 16, background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 60, borderRadius: 8, background: 'var(--onix-card)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, borderRadius: 4, background: 'var(--onix-card)', width: '75%' }} />
                <div style={{ height: 12, borderRadius: 4, background: 'var(--onix-card)', width: '90%' }} />
                <div style={{ height: 12, borderRadius: 4, background: 'var(--onix-card)', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Articles */}
      {!loading && !error && articles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles.filter(a => a.title !== '[Removed]').map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  borderRadius: 12, padding: 16,
                  background: 'var(--onix-surface)', border: '1px solid var(--onix-border)',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--onix-gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--onix-border)')}
              >
                {/* Thumbnail */}
                {article.urlToImage ? (
                  <img
                    src={article.urlToImage}
                    alt=""
                    style={{ width: 88, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: 88, height: 64, borderRadius: 8, background: 'var(--onix-card)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <NewsPlaceholderIcon />
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--onix-gold)', background: 'rgba(201,168,76,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                      {article.source.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--onix-muted)' }}>
                      {timeAgo(article.publishedAt)}
                    </span>
                    {article.author && (
                      <span style={{ fontSize: 11, color: 'var(--onix-muted)' }}>· {article.author.split(',')[0]}</span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--onix-text)', lineHeight: 1.4, marginBottom: 6 }}>
                    {article.title}
                  </h3>
                  {article.description && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--onix-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {article.description}
                    </p>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--onix-gold)', fontSize: 12, fontWeight: 500 }}>
                    Read full article <ArrowIcon />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', color: 'var(--onix-muted)' }}>
          <span style={{ fontSize: 40 }}>📰</span>
          <p style={{ margin: 0, fontSize: 14 }}>No news found. Try a different search or category.</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--onix-border)', background: 'var(--onix-card)', color: 'var(--onix-muted)', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid', borderColor: page === p ? 'var(--onix-gold)' : 'var(--onix-border)', background: page === p ? 'rgba(201,168,76,0.1)' : 'var(--onix-card)', color: page === p ? 'var(--onix-gold)' : 'var(--onix-muted)', fontSize: 13, fontWeight: page === p ? 600 : 400, cursor: 'pointer' }}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--onix-border)', background: 'var(--onix-card)', color: 'var(--onix-muted)', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={style}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function NewsPlaceholderIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--onix-border)' }}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  );
}
