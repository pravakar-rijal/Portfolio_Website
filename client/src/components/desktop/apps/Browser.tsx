import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Globe, FileText, Linkedin, Github,
  ExternalLink, Briefcase, MapPin, Mail, Smartphone, Code, Folder,
  User, Eye, Rss, TrendingUp, Save, Printer, Plus,
  Trash2, RefreshCw, BookOpen, AlertCircle, ChevronLeft, Lock,
  GraduationCap, Award, Phone, ChevronRight,
} from 'lucide-react';
import { api } from '../../../api/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Internal URL matcher ─────────────────────────────────────────────────────
const INTERNAL_URLS = [
  'portfolio.dev', 'blog.pravakar.dev', 'resume.pravakar.dev',
  'linkedin.com/in/pravakar-rijal', 'github.com/pravakarrijal', 'news.ycombinator.com',
];
const isInternal = (url: string) => INTERNAL_URLS.some(i => url === i || url.startsWith(i));
const toHref = (url: string) => url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

// ── Bookmarks ────────────────────────────────────────────────────────────────
const BOOKMARKS = [
  { name: 'Portfolio', url: 'portfolio.dev',                    Icon: User },
  { name: 'Blog',      url: 'blog.pravakar.dev',                Icon: FileText },
  { name: 'LinkedIn',  url: 'linkedin.com/in/pravakar-rijal',   Icon: Linkedin },
  { name: 'GitHub',    url: 'github.com/pravakarrijal',         Icon: Github },
  { name: 'Resume',    url: 'resume.pravakar.dev',              Icon: FileText },
  { name: 'Tech News', url: 'news.ycombinator.com',             Icon: Rss },
];

// ── Iframe page (real external browser) ──────────────────────────────────────
function IframePage({ url }: { url: string }) {
  const [loaded, setLoaded]   = useState(false);
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoaded(false); setBlocked(false);
    const timer = setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!doc || doc.body?.innerHTML === '') setBlocked(true);
      } catch { setBlocked(true); }
    }, 4000);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-800 shrink-0">
        <div className="flex items-center gap-1.5">
          {blocked
            ? <><AlertCircle className="w-3.5 h-3.5 text-red-500" /> This site blocks embedding.</>
            : <><Globe className="w-3.5 h-3.5" /> External site — some features may be limited</>}
        </div>
        <a href={url} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 font-semibold text-blue-700 hover:underline">
          <ExternalLink className="w-3 h-3" /> Open in new tab
        </a>
      </div>
      {!loaded && !blocked && (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-400 text-sm">
          <RotateCw className="w-5 h-5 animate-spin" /> Loading {url}…
        </div>
      )}
      {blocked ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
          <AlertCircle className="w-12 h-12 text-gray-300" />
          <p className="text-gray-600 font-medium">This site can't be displayed here</p>
          <p className="text-gray-400 text-sm text-center max-w-xs">
            {url.includes('github.com') || url.includes('linkedin.com')
              ? 'This site blocks embedding for security reasons.'
              : 'This site uses headers that prevent embedding.'}
          </p>
          <a href={url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <ExternalLink className="w-4 h-4" /> Open {url} in new tab
          </a>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          className="flex-1 w-full border-none"
          onLoad={() => setLoaded(true)}
          onError={() => setBlocked(true)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          title="browser"
          style={{ display: loaded ? 'block' : 'none' }}
        />
      )}
    </div>
  );
}

// ── Tech News ─────────────────────────────────────────────────────────────────
function TechNewsPage() {
  const [hnStories,   setHnStories]   = useState<any[]>([]);
  const [devArticles, setDevArticles] = useState<any[]>([]);
  const [tab,         setTab]         = useState<'hn' | 'devto'>('hn');
  const [hnLoading,   setHnLoading]   = useState(true);
  const [devLoading,  setDevLoading]  = useState(true);
  const [hnError,     setHnError]     = useState(false);
  const [devError,    setDevError]    = useState(false);
  const [key,         setKey]         = useState(0);

  useEffect(() => {
    setHnLoading(true); setHnError(false);
    fetch(`/api/news/hn?hitsPerPage=30`)
      .then(r => r.json()).then(d => { setHnStories(d.hits || []); setHnLoading(false); })
      .catch(() => { setHnError(true); setHnLoading(false); });
    setDevLoading(true); setDevError(false);
    fetch(`/api/news/devto?per_page=20`)
      .then(r => r.json()).then(d => { setDevArticles(Array.isArray(d) ? d : []); setDevLoading(false); })
      .catch(() => { setDevError(true); setDevLoading(false); });
  }, [key]);

  const loading = tab === 'hn' ? hnLoading : devLoading;
  const error   = tab === 'hn' ? hnError   : devError;

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white font-sans">
      <div className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h1 className="text-xl font-bold">Tech News</h1>
          <span className="text-xs text-gray-600">Live feed</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button onClick={() => setTab('hn')}    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'hn'    ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'}`}>Hacker News</button>
            <button onClick={() => setTab('devto')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'devto' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'}`}>DEV Community</button>
          </div>
          <button onClick={() => setKey(k => k + 1)} title="Refresh" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-8 py-6">
        {loading && <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}</div>}
        {error && !loading && (
          <div className="text-center py-16 text-gray-500">
            <Rss className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p>Failed to load news feed.</p>
            <button onClick={() => setKey(k => k + 1)} className="mt-3 text-orange-400 text-sm hover:underline">Try again</button>
          </div>
        )}
        {tab === 'hn' && !loading && !error && (
          <div className="space-y-1">
            {hnStories.map((s: any, i: number) => (
              <a key={s.objectID} href={s.url || `https://news.ycombinator.com/item?id=${s.objectID}`}
                target="_blank" rel="noreferrer"
                className="group flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-gray-600 text-xs mt-1 w-5 shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug">{s.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span>▲ {s.points || 0}</span><span>{s.num_comments || 0} comments</span><span>{s.author}</span>
                    {s.url && (() => { try { return <span className="truncate">{new URL(s.url).hostname}</span>; } catch { return null; } })()}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-700 group-hover:text-orange-400 shrink-0 mt-0.5 transition-colors" />
              </a>
            ))}
          </div>
        )}
        {tab === 'devto' && !loading && !error && (
          <div className="space-y-4">
            {devArticles.map((a: any) => (
              <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                className="group block bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all">
                <div className="flex items-start gap-4">
                  {a.cover_image && <img src={a.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors leading-snug">{a.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">by {a.user?.name} · {a.readable_publish_date}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(a.tag_list || []).slice(0, 4).map((t: string) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                  <span>♥ {a.public_reactions_count}</span><span>💬 {a.comments_count}</span><span>⏱ {a.reading_time_minutes} min read</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Blog — public read-only ───────────────────────────────────────────────────
function BlogPage() {
  const [posts,    setPosts]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.blog.getPosts().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <div className="min-h-full bg-[#0a0a0a] text-white font-sans">
        <div className="border-b border-white/5 px-8 py-4 flex items-center gap-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> All posts
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-2">{selected.title}</h1>
          {selected.excerpt && <p className="text-gray-400 italic mb-2">{selected.excerpt}</p>}
          <p className="text-xs text-gray-600 mb-8">{new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content || ''}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white font-sans">
      <div className="border-b border-white/5 px-8 py-4 flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-400" />
        <h1 className="text-xl font-bold">Blog</h1>
        <span className="text-xs text-gray-600">blog.pravakar.dev</span>
      </div>
      <div className="max-w-3xl mx-auto px-8 py-8">
        {loading && (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}</div>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center py-24 text-gray-600">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-800" />
            <p className="text-lg font-medium text-gray-500">No posts yet</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        )}
        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((p: any) => (
              <button key={p.id} onClick={() => setSelected(p)}
                className="w-full text-left group bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all">
                <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">{p.title}</h2>
                {p.excerpt && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{p.excerpt}</p>}
                <p className="text-xs text-gray-700 mt-3">{new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resume — public read-only ─────────────────────────────────────────────────
function ResumePage({ profileData }: { profileData: any }) {
  const a          = profileData?.about          || {};
  const skills     = profileData?.skills?.technical || [];
  const experience = profileData?.experience     || [];
  const education  = profileData?.education      || [];
  const projects   = profileData?.projects       || [];
  const certs      = profileData?.certifications || [];

  const name     = a.name     || 'Pravakar Rijal';
  const title    = a.title    || '.NET Developer & Backend Specialist';
  const location = a.location || 'Kathmandu, Nepal';
  const email    = a.email    || 'pravakarrijal11@gmail.com';
  const phone    = a.phone    || '+977-9815185130';

  return (
    <div className="min-h-full bg-gray-100 font-sans">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-gray-600" /><span className="font-semibold text-gray-800">Resume</span></div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Printer className="w-4 h-4" /> Export PDF
        </button>
      </div>
      <div className="max-w-[800px] mx-auto my-8 bg-white shadow-xl p-12 text-black space-y-8">
        <div className="text-center space-y-2 border-b pb-8 border-gray-200">
          <h1 className="text-4xl font-bold uppercase tracking-widest">{name}</h1>
          <p className="text-xl text-gray-600">{title}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{email}</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4" />{phone}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{location}</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm">
            <a href="https://www.linkedin.com/in/pravakar-rijal/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>
            <a href="https://github.com/pravakarrijal"            target="_blank" rel="noreferrer" className="text-gray-700 hover:underline flex items-center gap-1"><Github  className="w-3.5 h-3.5" /> GitHub</a>
          </div>
        </div>
        {experience.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 tracking-wide">Experience</h2>
            {experience.map((e: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline"><span className="font-bold">{e.role}</span><span className="text-sm text-gray-500">{e.period}</span></div>
                <div className="text-gray-700 italic">{e.company}{e.location ? `, ${e.location}` : ''}</div>
                {e.description && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{e.description}</p>}
                {(e.tech || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{e.tech.map((t: string, j: number) => <span key={j} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t}</span>)}</div>}
              </div>
            ))}
          </div>
        )}
        {education.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 tracking-wide">Education</h2>
            {education.map((e: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-baseline"><span className="font-bold">{e.degree}</span><span className="text-sm text-gray-500">{e.period}</span></div>
                <div className="text-gray-700 italic">{e.institution}</div>
              </div>
            ))}
          </div>
        )}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 tracking-wide">Projects</h2>
            {projects.slice(0, 4).map((p: any, i: number) => (
              <div key={i}>
                <span className="font-bold">{p.name}</span>
                {(p.tech || []).length > 0 && <span className="text-gray-500 text-xs ml-2">[{p.tech.join(', ')}]</span>}
                {p.description && <span className="text-sm text-gray-700"> — {p.description}</span>}
              </div>
            ))}
          </div>
        )}
        {skills.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 tracking-wide">Skills</h2>
            <p className="text-sm leading-relaxed">{skills.map((s: any) => s.name).join(' · ')}</p>
          </div>
        )}
        {certs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 tracking-wide">Certifications</h2>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              {certs.map((c: any, i: number) => <li key={i}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}{c.date ? ` (${c.date})` : ''}</li>)}
            </ul>
          </div>
        )}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">resume.pravakar.dev</div>
      </div>
    </div>
  );
}

// ── Main Browser component ────────────────────────────────────────────────────
export default function Browser({
  profileData,
  openApp,
  initialUrl = 'portfolio.dev',
}: {
  profileData: any;
  openApp: (app: string) => void;
  initialUrl?: string;
}) {
  const [url,      setUrl]      = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [loading,  setLoading]  = useState(false);
  const [history,  setHistory]  = useState<string[]>([initialUrl]);
  const [histIdx,  setHistIdx]  = useState(0);

  const navigate = (newUrl: string) => {
    if (newUrl === url) return;
    setLoading(true);
    setTimeout(() => {
      setUrl(newUrl); setInputUrl(newUrl);
      setHistory(h => [...h.slice(0, histIdx + 1), newUrl]);
      setHistIdx(i => i + 1);
      setLoading(false);
    }, 250);
  };

  const goBack    = () => { if (histIdx > 0) { const p = history[histIdx - 1]; setUrl(p); setInputUrl(p); setHistIdx(i => i - 1); } };
  const goForward = () => { if (histIdx < history.length - 1) { const n = history[histIdx + 1]; setUrl(n); setInputUrl(n); setHistIdx(i => i + 1); } };

  const a          = profileData?.about      || {};
  const skills     = profileData?.skills?.technical || [];
  const experience = profileData?.experience || [];
  const projects   = profileData?.projects   || [];

  const name     = a.name     || 'Pravakar Rijal';
  const title    = a.title    || '.NET Developer & Backend Specialist';
  const location = a.location || 'Kathmandu, Nepal';
  const email    = a.email    || 'pravakarrijal11@gmail.com';

  const isBlog      = url === 'blog.pravakar.dev';
  const isResume    = url === 'resume.pravakar.dev';
  const isNews      = url === 'news.ycombinator.com';
  const isPortfolio = url === 'portfolio.dev';
  const isLinkedIn  = url === 'linkedin.com/in/pravakar-rijal';
  const isGitHub    = url === 'github.com/pravakarrijal';
  const external    = !isInternal(url);
  const displayUrl  = external ? toHref(url) : url;

  return (
    <div className="h-full flex flex-col bg-white text-black" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Chrome toolbar */}
      <div className="bg-[#f1f3f4] border-b border-gray-300 px-2 py-1.5 flex items-center gap-2 shrink-0">
        <button onClick={goBack}    disabled={histIdx === 0}                 className="p-1.5 hover:bg-gray-200 rounded-full disabled:opacity-30"><ArrowLeft  className="w-4 h-4 text-gray-600" /></button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1} className="p-1.5 hover:bg-gray-200 rounded-full disabled:opacity-30"><ArrowRight className="w-4 h-4 text-gray-600" /></button>
        <button onClick={() => navigate(url)}                                className="p-1.5 hover:bg-gray-200 rounded-full"><RotateCw   className="w-4 h-4 text-gray-600" /></button>
        <div className="flex-1 bg-white rounded-full border border-transparent hover:border-gray-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 px-4 py-1.5 flex items-center gap-2 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input type="text" value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate(inputUrl); }}
            className="flex-1 outline-none text-sm bg-transparent text-gray-700"
          />
        </div>
        {external && (
          <a href={displayUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-200 rounded-full" title="Open in new tab">
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
        )}
      </div>

      {/* Bookmarks bar */}
      <div className="bg-[#f1f3f4] border-b border-gray-300 px-3 py-1 flex gap-1 text-xs shrink-0 overflow-x-auto">
        {BOOKMARKS.map(b => {
          const Icon = b.Icon;
          return (
            <button key={b.name} onClick={() => navigate(b.url)}
              className={`flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 rounded whitespace-nowrap transition-colors ${url === b.url ? 'bg-gray-200 font-semibold text-gray-900' : 'text-gray-600'}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" /> {b.name}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center gap-3">
          <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-y-auto relative">

        {external    && <IframePage url={displayUrl} />}
        {isBlog      && <BlogPage />}
        {isResume    && <ResumePage profileData={profileData} />}
        {isNews      && <TechNewsPage />}

        {/* Portfolio */}
        {isPortfolio && (
          <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-10 pb-24">

              {/* ── Hero ── */}
              <div className="py-10 sm:py-16 lg:py-20 space-y-4 sm:space-y-6 border-b border-white/5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-full text-xs text-cyan-400 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Open to new opportunities
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{name || 'Pravakar Rijal'}</h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl text-cyan-400 font-light">{title || '.NET Developer & Backend Specialist'}</h2>
                <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
                  Building reliable, scalable systems from Kathmandu, Nepal. Passionate about clean architecture, enterprise software, and backend development.
                </p>
                <div className="flex gap-3 pt-2 flex-wrap">
                  <button onClick={() => navigate('linkedin.com/in/pravakar-rijal')}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm sm:text-base">
                    <Mail className="w-4 h-4" /> Contact Me
                  </button>
                  <button onClick={() => navigate('github.com/pravakarrijal')}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-700 rounded-lg hover:border-gray-500 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm sm:text-base">
                    <Github className="w-4 h-4" /> GitHub
                  </button>
                  <button onClick={() => navigate('resume.pravakar.dev')}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-700 rounded-lg hover:border-gray-500 hover:bg-white/5 transition-colors text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="w-4 h-4" /> Resume
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Kathmandu, Nepal</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> pravakarrijal11@gmail.com</span>
                </div>
              </div>

              {/* ── Skills ── */}
              <div className="py-10 sm:py-14 space-y-6 border-b border-white/5">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3"><Code className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" /> Technical Arsenal</h3>
                <div className="flex flex-wrap gap-2">
                  {(skills.length > 0 ? skills : [
                    { name: 'C#', level: 5 }, { name: '.NET Core', level: 5 }, { name: 'ASP.NET Core MVC', level: 4 },
                    { name: 'Entity Framework Core', level: 4 }, { name: 'SQL Server', level: 4 },
                    { name: 'REST API Design', level: 5 }, { name: 'React', level: 4 }, { name: 'Angular', level: 4 },
                    { name: 'TypeScript', level: 4 }, { name: 'JWT Auth', level: 4 }, { name: 'Tailwind CSS', level: 3 },
                  ]).map((s: any, i: number) => (
                    <div key={i} className="group px-3 sm:px-4 py-2 rounded-full bg-gray-900 border border-gray-800 hover:border-cyan-800 transition-all text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                      <span>{s.name}</span>
                      <span className="text-cyan-500 text-[10px] sm:text-xs font-mono">{'▮'.repeat(s.level || 3)}{'▯'.repeat(5 - (s.level || 3))}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: 'Backend',    items: ['C# / .NET', 'EF Core', 'REST APIs', 'SQL Server'] },
                    { label: 'Frontend',   items: ['React', 'Angular', 'TypeScript', 'Tailwind CSS'] },
                    { label: 'Tools',      items: ['Git', 'Postman', 'Visual Studio', 'Jira / Scrum'] },
                  ].map(cat => (
                    <div key={cat.label} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">{cat.label}</h4>
                      <ul className="space-y-1.5">
                        {cat.items.map(item => (
                          <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                            <ChevronRight className="w-3 h-3 text-cyan-500 shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Projects ── */}
              <div className="py-10 sm:py-14 space-y-6 border-b border-white/5">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3"><Folder className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" /> Featured Projects</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(projects.length > 0 ? projects : [
                    { name: 'vStellar', description: 'VS Code-like IDE built with ElectronJS + Angular with a built-in Java test runner for running code directly in the browser.', tech: ['ElectronJS', 'Angular', 'Java', 'TypeScript'] },
                    { name: 'yAIntra',  description: 'Enterprise HRMS featuring Role-Based Access Control, REST APIs, and JWT/Session authentication research for multi-user environments.', tech: ['.NET Core', 'SQL Server', 'REST API', 'JWT'] },
                    { name: 'NumAIrik', description: 'Multi-tenant accounting software with full 2-Factor Authentication: Email OTP, SMS OTP, and Authenticator App support.', tech: ['ASP.NET Core', 'EF Core', 'SQL Server', '2FA'] },
                  ]).map((p: any, i: number) => (
                    <div key={i} className="p-4 sm:p-6 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-cyan-900 transition-all space-y-3 group">
                      <div className="flex items-start justify-between">
                        <h4 className="text-base sm:text-xl font-bold group-hover:text-cyan-400 transition-colors">{p.name}</h4>
                        <Github className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5" />
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{p.description}</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                        {(p.tech || []).map((t: string, j: number) => (
                          <span key={j} className="text-[10px] sm:text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-900/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Experience ── */}
              <div className="py-10 sm:py-14 space-y-6 border-b border-white/5">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3"><Briefcase className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" /> Experience</h3>
                <div className="border-l-2 border-gray-800 pl-5 sm:pl-8 py-2 space-y-8">
                  {(experience.length > 0 ? experience : [
                    { role: 'Backend .NET Trainee', company: 'Vertex Special Technology', period: 'Feb 2025 – Present', description: 'Building enterprise software, conducting PoCs, collaborating across teams in Nepal, Pakistan, and the US using Scrum methodology.' },
                  ]).map((e: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute w-2.5 sm:w-3 h-2.5 sm:h-3 bg-cyan-400 rounded-full -left-[29px] sm:-left-[41px] top-1.5 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                        <div>
                          <h4 className="text-sm sm:text-lg font-bold">{e.role}</h4>
                          <p className="text-cyan-400 text-xs sm:text-sm mt-0.5">{e.company}</p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-mono bg-gray-900 px-2 sm:px-3 py-1 rounded-full border border-gray-800 self-start shrink-0">{e.period}</span>
                      </div>
                      {e.description && <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Education & Certifications ── */}
              <div className="py-10 sm:py-14 space-y-6 border-b border-white/5">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3"><GraduationCap className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" /> Education</h3>
                <div className="p-4 sm:p-6 bg-gray-900/80 border border-gray-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-sm sm:text-base">BSc Computer Science & Information Technology</h4>
                  <p className="text-cyan-400 text-xs sm:text-sm">Bhaktapur Multiple Campus, Tribhuvan University</p>
                  <p className="text-gray-500 text-xs font-mono">2021 – 2025</p>
                  <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-yellow-400">
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Academic Excellence Scholarship 2024
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 pt-2"><Award className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" /> Certifications</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Microsoft Certified: Foundational C#', org: 'Microsoft', date: 'Sept 2024', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/40' },
                    { name: 'CS50: Introduction to Computer Science', org: 'Harvard University', date: 'Jun 2023', color: 'text-red-400', bg: 'bg-red-950/30 border-red-900/40' },
                  ].map(cert => (
                    <div key={cert.name} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${cert.bg}`}>
                      <Award className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${cert.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm">{cert.name}</p>
                        <p className={`text-[10px] sm:text-xs ${cert.color} mt-0.5`}>{cert.org}</p>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 font-mono shrink-0">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Contact ── */}
              <div className="py-10 sm:py-14 space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3"><Mail className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" /> Get In Touch</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: <Mail     className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />, label: 'Email',    val: email || 'pravakarrijal11@gmail.com',  href: `mailto:${email || 'pravakarrijal11@gmail.com'}` },
                    { icon: <Phone    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0"  />, label: 'Phone',    val: '+977-9815185130',                    href: 'tel:+9779815185130' },
                    { icon: <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0"  />, label: 'LinkedIn', val: 'linkedin.com/in/pravakar-rijal',      href: '#', onClick: () => navigate('linkedin.com/in/pravakar-rijal') },
                    { icon: <Github   className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 shrink-0"  />, label: 'GitHub',   val: 'github.com/pravakarrijal',           href: '#', onClick: () => navigate('github.com/pravakarrijal') },
                  ].map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick!(); } : undefined}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors group"
                    >
                      {item.icon}
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-500">{item.label}</p>
                        <p className="text-xs sm:text-sm text-gray-200 group-hover:text-white transition-colors truncate">{item.val}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 ml-auto shrink-0 group-hover:text-gray-400 transition-colors" />
                    </a>
                  ))}
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 border border-cyan-900/30 rounded-xl text-center">
                  <p className="text-base sm:text-lg font-semibold text-cyan-400 mb-2">Available for .NET / Backend Roles</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Open to full-time opportunities. Let's build something great together.</p>
                  <a href={`mailto:${email || 'pravakarrijal11@gmail.com'}`}
                    className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-sm sm:text-base">
                    <Mail className="w-4 h-4" /> Send a Message
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* LinkedIn */}
        {isLinkedIn && (
          <div className="min-h-full bg-[#f3f2ef] p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-700 to-blue-500" />
              <div className="pt-20 px-8 pb-8 relative">
                <div className="absolute -top-16 left-8 w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-500">{name.split(' ').map((n: string) => n[0]).join('')}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <p className="text-lg text-gray-700">{title}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</p>
                <div className="flex gap-2 mt-4">
                  <button className="bg-[#0a66c2] text-white px-4 py-1.5 rounded-full font-medium text-sm">Connect</button>
                  <button className="border border-[#0a66c2] text-[#0a66c2] px-4 py-1.5 rounded-full font-medium text-sm">Message</button>
                </div>
                {experience.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg mt-6">
                    <h2 className="font-bold mb-3">Experience</h2>
                    <div className="space-y-3">
                      {experience.slice(0, 2).map((e: any, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded shrink-0"><Briefcase className="w-5 h-5 text-gray-500" /></div>
                          <div><div className="font-semibold text-sm">{e.role}</div><div className="text-sm text-gray-700">{e.company}</div><div className="text-xs text-gray-500">{e.period}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800 mt-6 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Visit: <a href="https://www.linkedin.com/in/pravakar-rijal/" target="_blank" rel="noreferrer" className="font-bold underline ml-1">linkedin.com/in/pravakar-rijal</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GitHub */}
        {isGitHub && (
          <div className="min-h-full bg-[#0d1117] text-[#c9d1d9] p-8">
            <div className="max-w-6xl mx-auto flex gap-8">
              <div className="w-1/4 space-y-4 shrink-0">
                <div className="w-full aspect-square rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                  <Github className="w-24 h-24 text-[#8b949e]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{name}</h1>
                  <h2 className="text-xl text-[#8b949e] font-light">pravakarrijal</h2>
                </div>
                <p className="text-sm">{title}</p>
                <div className="text-sm text-[#8b949e] space-y-1">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{location}</div>
                  <div className="flex items-center gap-2"><Mail  className="w-4 h-4" />{email}</div>
                </div>
                <a href="https://github.com/pravakarrijal" target="_blank" rel="noreferrer"
                  className="block w-full text-center bg-[#21262d] border border-[#30363d] hover:border-gray-500 text-sm text-white py-1.5 rounded-md transition-colors">
                  View on GitHub
                </a>
              </div>
              <div className="w-3/4 space-y-6">
                <div className="text-sm text-[#8b949e]">Pinned</div>
                <div className="grid grid-cols-2 gap-4">
                  {(projects.length > 0 ? projects : [
                    { name: 'vStellar', description: 'VS Code-like IDE built with ElectronJS + Angular.', tech: ['ElectronJS'] },
                    { name: 'yAIntra',  description: 'HRMS with REST APIs, RBAC, JWT/Session auth.',     tech: ['.NET Core']  },
                    { name: 'NumAIrik', description: 'Accounting Software with 2FA and multi-tenant.',   tech: ['C#']          },
                  ]).slice(0, 4).map((p: any, i: number) => (
                    <div key={i} className="border border-[#30363d] rounded-md p-4 bg-[#0d1117] flex flex-col h-32 hover:border-[#58a6ff]/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="w-4 h-4 text-[#8b949e]" />
                        <span className="text-[#58a6ff] font-semibold text-sm cursor-pointer hover:underline">{p.name}</span>
                      </div>
                      <p className="text-xs text-[#8b949e] flex-1 leading-relaxed line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <span className="w-3 h-3 rounded-full bg-[#178600] inline-block" />
                        <span className="text-[#8b949e]">{(p.tech || [])[0] || 'C#'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
