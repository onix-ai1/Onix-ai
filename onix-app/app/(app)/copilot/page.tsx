'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeals } from '@/lib/api';

/* ── Types ────────────────────────────────────────────────────────── */
interface Message {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'How do I prepare my company for a Series A fundraise?',
  'What are the key sections of an Information Memorandum?',
  'Analyse my pipeline and suggest which deal is closest to closing.',
  'How should I price my company for an M&A exit?',
  'Draft an investor outreach email for a PE firm.',
  'What due diligence materials do buyers typically request?',
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function CopilotPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError]         = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
  });

  // Build deal context string
  const dealContext = deals.length
    ? deals.map(d =>
        `• ${d.name} | Sector: ${d.sector} | Stage: ${d.stage} | Value: ${d.value} | Fit Score: ${d.fit_score}%`
      ).join('\n')
    : '';

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, dealContext }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const { content } = JSON.parse(payload);
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + content } : m
              )
            );
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, dealContext]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto" style={{ height: 'calc(100vh - 64px - 3rem)' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid var(--onix-gold)' }}
          >
            <SparkleIcon />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--onix-text)' }}>AI Co-Pilot</h2>
            <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>
              Powered by GPT-4o · {deals.length} deal{deals.length !== 1 ? 's' : ''} in context
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1">

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--onix-border)' }}
            >
              <SparkleIcon size={28} />
            </div>
            <div className="text-center">
              <p className="text-base font-medium mb-1" style={{ color: 'var(--onix-text)' }}>
                How can I help with your deal?
              </p>
              <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
                Ask anything about M&A, fundraising, or your pipeline.
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={streaming}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: 'var(--onix-card)',
                    border:     '1px solid var(--onix-border)',
                    color:      'var(--onix-text)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--onix-gold)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--onix-border)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="flex-shrink-0 mt-3 rounded-2xl p-3 flex items-end gap-2"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about M&A, fundraising, your deals…"
          rows={1}
          disabled={streaming}
          className="flex-1 resize-none text-sm outline-none"
          style={{
            background: 'transparent',
            color:      'var(--onix-text)',
            lineHeight: '1.5',
            maxHeight:  '160px',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: !input.trim() || streaming ? 'var(--onix-border)' : 'var(--onix-gold)',
            color:      !input.trim() || streaming ? 'var(--onix-muted)' : '#0D0D0D',
          }}
          title="Send (Enter)"
        >
          {streaming ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: 'var(--onix-border)' }}>
        AI-generated guidance only — not legal or financial advice.
      </p>
    </div>
  );
}

/* ── MessageBubble ────────────────────────────────────────────────── */
function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid var(--onix-gold)' }}
      >
        <SparkleIcon size={14} />
      </div>
      <div
        className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
      >
        {message.content ? (
          <FormattedContent content={message.content} />
        ) : (
          isStreaming && (
            <span className="flex gap-1 items-center" style={{ color: 'var(--onix-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--onix-gold)', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--onix-gold)', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--onix-gold)', animationDelay: '300ms' }} />
            </span>
          )
        )}
        {isStreaming && message.content && (
          <span
            className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
            style={{ background: 'var(--onix-gold)' }}
          />
        )}
      </div>
    </div>
  );
}

/* ── FormattedContent — render markdown-ish bullet lists ─────────── */
function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span style={{ color: 'var(--onix-gold)', flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={key++} className="flex gap-2 my-0.5">
            <span style={{ color: 'var(--onix-gold)', flexShrink: 0 }}>{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      const text = line.replace(/^#+\s/, '');
      elements.push(
        <p key={key++} className="font-semibold mt-2 mb-1 text-sm" style={{ color: 'var(--onix-text)' }}>
          {text}
        </p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="my-0.5">{renderInline(line)}</p>);
    }
  }

  return <div className="space-y-0 leading-relaxed">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--onix-text)' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/* ── Icons ────────────────────────────────────────────────────────── */
function SparkleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--onix-gold)" strokeWidth={1.8}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
