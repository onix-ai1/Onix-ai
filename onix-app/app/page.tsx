'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import './landing.css';

export default function LandingPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Mark body so landing.css custom cursor only applies here
    document.body.classList.add('landing-page');
    return () => document.body.classList.remove('landing-page');
  }, []);

  useEffect(() => {
    // Check session on mount
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goLogin()     { router.push('/login'); }
  function goRegister()  { router.push('/register'); }
  function goDashboard() { router.push('/dashboard'); }

  return (
    <>
      <canvas id="c" />
      <div id="cur" />
      <div id="curR" />

      {/* Scroll progress */}
      <div id="sp"><div id="spb" /></div>

      {/* Ticker */}
      <div className="ticker">
        <div className="ticker-track" id="ticker">
          {['4,200+ Active Listings','$2.8B Deal Flow','68 Countries','94% Valuation Accuracy','Avg. Close: 47 Days','12,000+ Members','New: Dubai Skincare — $9.5M',
            '4,200+ Active Listings','$2.8B Deal Flow','68 Countries','94% Valuation Accuracy','Avg. Close: 47 Days','12,000+ Members','New: Dubai Skincare — $9.5M'].map((t, i) => (
            <div key={i} className="ti">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav id="mainNav">
        <a href="/" className="nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" className="nav-logo-svg" alt="ONIX AI Logo" />
        </a>
        <div className="nav-links">
          <a href="#marketplace">Marketplace</a>
          <a href="#platform">Platform</a>
          <a href="#valuation">Valuation</a>
          <a href="#insights">AI Insights</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-right">
          {loggedIn ? (
            <button className="nbtn-solid" onClick={goDashboard}><span>Go to Dashboard</span></button>
          ) : (
            <>
              <button className="nbtn" onClick={goLogin}>Login</button>
              <button className="nbtn-solid" onClick={goRegister}><span>Sign Up Free</span></button>
            </>
          )}
          <button className="mob-toggle" id="mobToggle"><span /><span /><span /></button>
        </div>
      </nav>

      <div className="mob-menu" id="mobMenu">
        <a href="#marketplace">Marketplace</a>
        <a href="#platform">Platform</a>
        <a href="#valuation">Valuation</a>
        <a href="#insights">AI Insights</a>
        <a href="#about">About</a>
        <div className="mob-cta">
          {loggedIn ? (
            <button className="nbtn-solid" onClick={goDashboard}><span>Go to Dashboard</span></button>
          ) : (
            <>
              <button className="nbtn" onClick={goLogin}>Login</button>
              <button className="nbtn-solid" onClick={goRegister}><span>Sign Up Free</span></button>
            </>
          )}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="h-grid" /><div className="h-glow" /><div className="h-glow2" />
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        <div className="cr cr-tl" /><div className="cr cr-tr" />
        <div className="cr cr-bl" /><div className="cr cr-br" />
        <div className="side-line l" /><div className="side-line r" />
        <div className="hero-inner">
          <div className="live-badge"><div className="live-dot" />Live Marketplace — 4,200+ Deals Active</div>
          <div className="hero-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" className="hero-logo-svg" alt="ONIX AI Logo" style={{width:320,maxWidth:'80vw',height:'auto',opacity:0.95,display:'block',margin:'0 auto'}} />
          </div>
          <div className="hero-eyebrow">
            <div className="eyebrow-line el-l" /><span className="eyebrow-text">The Global Business Exchange</span><div className="eyebrow-line el-r" />
          </div>
          <h1 className="hero-title">
            Buy &amp; Sell Business<br /><em>Globally</em>
            <span className="sub">AI-Powered M&amp;A Marketplace</span>
          </h1>
          <p className="hero-desc">
            Discover, evaluate, and acquire exceptional businesses worldwide.
            ONIX AI brings <strong>institutional-grade intelligence</strong> to every deal —
            from $50K revenue to $100 billion dollar revenue company acquisitions.
          </p>
          <div className="hero-search">
            <input type="text" placeholder="Search by industry, revenue, country, or describe your ideal acquisition…" />
            <button className="hero-search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </div>
          <div className="hero-btns">
            <button className="btn-p" onClick={goRegister}><span>Browse Listings</span></button>
            <button className="btn-o" onClick={goRegister}>List Your Business</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item"><div className="stat-num" data-t="10000" data-s="+">10000+</div><div className="stat-lbl">Active Listings</div></div>
          <div className="stat-item"><div className="stat-num">$2.8B</div><div className="stat-lbl">Deal Flow Processed</div></div>
          <div className="stat-item"><div className="stat-num" data-t="120" data-s="">120</div><div className="stat-lbl">Countries Served</div></div>
          <div className="stat-item"><div className="stat-num" data-t="94" data-s="%">94%</div><div className="stat-lbl">Valuation Accuracy</div></div>
        </div>
      </section>

      <Ornament />

      {/* TRUST */}
      <div className="trust">
        <div className="trust-lbl">Trusted by dealmakers across leading institutions</div>
        <div className="trust-logos">
          {['Goldman','Sequoia','Temasek','SoftBank','Apex Capital','KPMG'].map((l) => (
            <div key={l} className="tlg">{l}</div>
          ))}
        </div>
      </div>

      <Ornament />

      {/* MARKETPLACE */}
      <section className="marketplace" id="marketplace">
        <div className="sec-hd">
          <div className="sec-ey"><div className="sec-line sl-l" /><span>Live Marketplace</span><div className="sec-line sl-r" /></div>
          <h2 className="sec-title reveal">Featured <em>Acquisitions</em></h2>
          <p className="sec-sub reveal">Curated, verified opportunities scored by AI across financials, growth, and strategic fit.</p>
        </div>
        <div className="filter-bar reveal">
          {['All Sectors','E-Commerce','SaaS','Manufacturing','Healthcare','F&B','Real Estate','Digital Media'].map((f, i) => (
            <button key={f} className={`fc${i === 0 ? ' active' : ''}`}>{f}</button>
          ))}
        </div>
        <div className="listings">
          <ListingCard badge="Verified" badgeClass="v" score="9.2" loc="Singapore / Southeast Asia"
            title="Premium B2B SaaS Platform — HR Analytics" cat="Software-as-a-Service"
            metrics={[['Annual Revenue','$1.4M',true],['EBITDA Margin','42%',false],['YoY Growth','+68%',true],['Customers','340+',false]]} price="$5.2M" />
          <ListingCard badge="Featured" badgeClass="f" score="8.7" loc="Mumbai, India"
            title="Specialty Chemical Manufacturer — Export-Ready" cat="Manufacturing &amp; Industrial"
            metrics={[['Annual Revenue','₹18Cr',true],['EBITDA Margin','28%',false],['YoY Growth','+31%',true],['Est. Year','2008',false]]} price="₹42Cr" delay="d1" />
          <ListingCard badge="Verified" badgeClass="v" score="9.5" loc="Dubai, UAE"
            title="D2C Luxury Skincare Brand — Global Distribution" cat="Consumer Goods / E-Commerce"
            metrics={[['Annual Revenue','$3.1M',true],['Net Margin','36%',false],['YoY Growth','+89%',true],['AOV','$142',false]]} price="$9.5M" delay="d2" />
        </div>
      </section>

      <Ornament />

      {/* FEATURES */}
      <section className="features" id="platform">
        <div className="sec-hd">
          <div className="sec-ey"><div className="sec-line sl-l" /><span>Platform Capabilities</span><div className="sec-line sl-r" /></div>
          <h2 className="sec-title reveal">Intelligence at <em>Every Step</em></h2>
          <p className="sec-sub reveal">Six specialized AI agents handle every dimension of your deal — from discovery to close.</p>
        </div>
        <div className="feat-grid">
          {[
            {n:'01',title:'AI Valuation Engine',desc:'Instant, explainable valuations using DCF, market multiples, and comparable transactions. Confidence-scored with transparent assumptions.'},
            {n:'02',title:'Smart Deal Matching',desc:'Buyers and sellers matched by AI based on acquisition criteria, risk profile, financial capacity, and strategic synergy.',delay:'d1'},
            {n:'03',title:'Due Diligence Agent',desc:'Upload financials and contracts. The diligence agent surfaces red flags, inconsistencies, and key risks in minutes.',delay:'d2'},
            {n:'04',title:'Secure Data Room',desc:'Encrypted virtual data rooms with NDA enforcement, granular access controls, and full activity tracking.',delay:'d1'},
            {n:'05',title:'Global Cross-Border',desc:'Multi-currency support, regulatory summaries (CCI, SEBI, GDPR), and deal structuring for 68+ countries.',delay:'d2'},
            {n:'06',title:'Negotiation Suite',desc:'AI-drafted NDAs, LOIs, and term sheets. Negotiation coaching, scenario modelling, and deal structure optimization.',delay:'d3'},
          ].map(({n,title,desc,delay=''}) => (
            <div key={n} className={`feat-card reveal${delay ? ' '+delay : ''}`}>
              <span className="feat-n">{n}</span>
              <h3 className="feat-title">{title}</h3>
              <p className="feat-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="process" id="about">
        <div className="sec-hd">
          <div className="sec-ey"><div className="sec-line sl-l" /><span>How It Works</span><div className="sec-line sl-r" /></div>
          <h2 className="sec-title reveal">From Discovery<br />to <em>Close</em></h2>
        </div>
        <div className="proc-track">
          <div className="proc-conn"><div className="proc-line" /><div className="proc-dot" /></div>
          {[
            {n:'I',title:'Define Criteria',desc:"Tell our AI what you're looking for — or describe your business for sale. Natural language, instantly structured."},
            {n:'II',title:'AI Discovers & Scores',desc:'Our matching engine surfaces the best opportunities, scored across 12 financial and strategic dimensions.',delay:'d1'},
            {n:'III',title:'Deep Evaluation',desc:'Access AI valuation reports, diligence summaries, and risk analysis. Request the secure data room in one click.',delay:'d2'},
            {n:'IV',title:'Negotiate & Transact',desc:'AI-assisted term sheets, escrow integration, and deal tracking. Close faster with institutional-grade tools.',delay:'d3'},
          ].map(({n,title,desc,delay=''}) => (
            <div key={n} className={`proc-step reveal${delay ? ' '+delay : ''}`}>
              <div className="step-n">{n}</div>
              <h3 className="step-title">{title}</h3>
              <p className="step-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Ornament />

      {/* AI INSIGHTS */}
      <div className="ai-sec" id="insights">
        <div className="ai-content">
          <div className="sec-ey"><div className="sec-line sl-l" /><span>AI Intelligence</span></div>
          <h2 className="sec-title reveal">Institutional Analysis,<br /><em>Democratized</em></h2>
          <p className="sec-sub reveal" style={{textAlign:'left',margin:'0 0 40px'}}>
            Our multi-agent AI delivers the same analytical depth that private equity firms spend weeks building — in seconds, for every deal.
          </p>
          <div className="ai-feats reveal">
            {[
              {title:'Instant Valuation Reports',desc:'DCF, revenue multiples, and market comparables with plain-English explanations and confidence intervals.'},
              {title:'Risk Flag Detection',desc:'Automated document analysis surfaces customer concentration, IP issues, and anomalies before you invest time in diligence.'},
              {title:'Synergy Estimation',desc:'Quantify strategic fit — cost synergies, revenue expansion, and market access between buyer and target.'},
            ].map(({title,desc}) => (
              <div key={title} className="ai-feat">
                <div className="ai-fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
                <div><div className="ai-ft">{title}</div><div className="ai-fd">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="ai-visual">
          <div className="score-card reveal">
            <div className="sc-title">AI Analysis Report</div>
            <div className="sc-name">Premium SaaS Platform — Singapore</div>
            <div className="score-bars">
              {[['Financial Health','91'],['Growth Trajectory','94'],['Market Position','83'],['Operational Risk','88'],['Buyer Synergy Fit','92']].map(([l,w]) => (
                <div key={l}><div className="sb-hd"><span className="sb-lbl">{l}</span><span className="sb-val">{Number(w)/10} / 10</span></div><div className="sb-track"><div className="sb-fill" style={{width:`${w}%`}} /></div></div>
              ))}
            </div>
            <div className="ibadges">
              <span className="ib ib-g">Strong MRR Growth</span>
              <span className="ib ib-au">Low Churn</span>
              <span className="ib ib-g">Export-Ready</span>
              <span className="ib ib-r">Single-Founder Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="testi">
        <div className="sec-hd">
          <div className="sec-ey"><div className="sec-line sl-l" /><span>Client Voices</span><div className="sec-line sl-r" /></div>
          <h2 className="sec-title reveal">Trusted by <em>Dealmakers</em></h2>
        </div>
        <div className="testi-grid">
          {[
            {q:'ONIX AI found us three acquisition targets in Southeast Asia that our team had completely missed. The AI scoring was almost eerily accurate — all three fit our thesis perfectly.',av:'RK',name:'Rajan Krishnamurthy',role:'Managing Partner, Apex Capital Partners'},
            {q:'I sold my D2C brand through ONIX in 11 weeks. The AI valuation matched what we eventually closed at within 4%. The data room and diligence tools made us look like a Fortune 500.',av:'SP',name:'Sneha Patel',role:'Founder, Bloom Naturals (Exited)',delay:'d1'},
            {q:"As a first-time buyer, ONIX was transformative. The diligence agent flagged a customer concentration issue that could have cost us $800K. It paid for itself before we signed.",av:'AM',name:'Ahmed Al-Mansouri',role:'Entrepreneur, Dubai',delay:'d2'},
          ].map(({q,av,name,role,delay=''}) => (
            <div key={name} className={`testi-card reveal${delay ? ' '+delay : ''}`}>
              <div className="tq">{q}</div>
              <div className="ta"><div className="tav">{av}</div><div><div className="tn">{name}</div><div className="tr">{role}</div></div></div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-vline" />
        <div className="sec-ey" style={{justifyContent:'center',marginBottom:28}}>
          <div className="sec-line sl-l" /><span style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'var(--gold)'}}>Begin Your Journey</span><div className="sec-line sl-r" />
        </div>
        <h2 className="cta-title reveal">Your Next<br /><em>Chapter</em> Awaits</h2>
        <p className="cta-sub reveal">Join over 12,000 entrepreneurs, investors, and advisors who trust ONIX AI to find, evaluate, and close their most important transactions.</p>
        <div className="cta-btns reveal">
          <button className="btn-p" onClick={goRegister}><span>Start for Free</span></button>
          <button className="btn-o" onClick={goRegister}>Request a Demo</button>
        </div>
        <div className="cta-guarantee reveal">
          <div className="gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Bank-grade Security</div>
          <div className="g-sep" />
          <div className="gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>NDA Protected</div>
          <div className="g-sep" />
          <div className="gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>68 Countries</div>
          <div className="g-sep" />
          <div className="gi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>94% AI Accuracy</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="fl-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" className="footer-logo-img" alt="ONIX AI" style={{height:44,width:'auto',opacity:0.9}} />
            </a>
            <p className="footer-tag">The world&apos;s most intelligent marketplace for buying, selling, and valuing businesses globally.</p>
            <div className="footer-social">
              <a href="#" className="fsoc">in</a>
              <a href="#" className="fsoc">X</a>
              <a href="#" className="fsoc">yt</a>
            </div>
          </div>
          <div><div className="fc-title">Platform</div><div className="footer-links"><a href="#">Browse Listings</a><a href="#">List a Business</a><a href="#">AI Valuation</a><a href="#">Data Room</a></div></div>
          <div><div className="fc-title">Solutions</div><div className="footer-links"><a href="#">For Buyers</a><a href="#">For Sellers</a><a href="#">For Brokers</a><a href="#">Enterprise</a></div></div>
          <div><div className="fc-title">Company</div><div className="footer-links"><a href="#">About ONIX</a><a href="#">Careers</a><a href="#">Contact</a><a href="#">Blog</a></div></div>
        </div>
        <div className="footer-bot">
          <div className="footer-copy">© 2025 ONIX AI. All rights reserved. Tirunelveli, India — Global.</div>
          <div className="footer-legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Security</a></div>
        </div>
      </footer>

      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}

function Ornament() {
  return (
    <div className="ornament-div">
      <div className="ornament-line" />
      <svg className="ornament-svg" width="48" height="20" viewBox="0 0 48 20" fill="none">
        <line x1="0" y1="10" x2="48" y2="10" stroke="#C4A052" strokeWidth="0.6"/>
        <ellipse cx="24" cy="10" rx="5" ry="3.5" stroke="#C4A052" strokeWidth="0.7" fill="none"/>
        <polygon points="0,10 5,8 5,12" fill="#C4A052"/>
        <polygon points="48,10 43,8 43,12" fill="#C4A052"/>
      </svg>
      <div className="ornament-line r" />
    </div>
  );
}

function ListingCard({ badge, badgeClass, score, loc, title, cat, metrics, price, delay = '' }: {
  badge: string; badgeClass: string; score: string; loc: string; title: string;
  cat: string; metrics: [string, string, boolean][]; price: string; delay?: string;
}) {
  return (
    <div className={`lc reveal${delay ? ' ' + delay : ''}`}>
      <div className="lc-hd">
        <div className="lc-badge"><div className={`bdot ${badgeClass}`} /><span className={`bt-${badgeClass}`}>{badge}</span></div>
        <div><div className="lc-score">{score}</div><div className="lc-score-lbl">AI Score</div></div>
      </div>
      <div className="lc-loc">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {loc}
      </div>
      <div className="lc-title">{title}</div>
      <div className="lc-cat" dangerouslySetInnerHTML={{ __html: cat }} />
      <div className="lc-metrics">
        {metrics.map(([label, val, hi]) => (
          <div key={label}><div className="metric-l">{label}</div><div className={`metric-v${hi ? ' hi' : ''}`}>{val}</div></div>
        ))}
      </div>
      <div className="lc-ft">
        <div><div className="lc-price-lbl">Asking Price</div><div className="lc-price">{price}</div></div>
        <button className="lc-cta"><span>View Deal</span></button>
      </div>
    </div>
  );
}
