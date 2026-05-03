import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../api/client';

type LineType = 'input' | 'output' | 'output-html' | 'error' | 'system' | 'ai-loading' | 'ai';
type HistoryLine = { type: LineType; content: string };
type Pending = null | 'notes_pin';

const NOTES_PIN = '3499';

// ── Virtual filesystem ──────────────────────────────────────────────────────
function buildFS(profile: any) {
  const about = profile?.about || {};
  const skills = (profile?.skills?.technical || []).map((s: any) => `${s.name}: ${s.level}/5  [${s.category}]`).join('\n');
  const contact = `Email:    ${about.email    || 'pravakarrijal11@gmail.com'}\nPhone:    ${about.phone    || '+977-9815185130'}\nLinkedIn: ${about.linkedin || 'linkedin.com/in/pravakar-rijal/'}\nGitHub:   ${about.github   || 'github.com/pravakarrijal'}`;
  return {
    '/home/pravakar': {
      'about.txt':   `${about.name || 'Pravakar Rijal'}\n${about.title || '.NET Developer'}\n${about.location || 'Kathmandu, Nepal'}\n\n${about.bio || ''}`,
      'skills.txt':  skills || 'C#: 5/5\n.NET Core: 4/5\nSQL Server: 4/5',
      'contact.txt': contact,
      'README.md':   `# Pravakar Rijal\n\nType 'help' to explore.\nType 'neofetch' for system info.\nType 'ai "question"' to ask about Pravakar.`,
      'projects': {
        ...(profile?.projects || []).reduce((acc: any, p: any) => {
          acc[`${p.name.toLowerCase().replace(/\s/g, '-')}.md`] = `# ${p.name}\n\n${p.description}\n\nTech: ${(p.tech || []).join(', ')}`;
          return acc;
        }, {})
      },
      'experience': {
        ...(profile?.experience || []).reduce((acc: any, e: any) => {
          acc[`${e.company.toLowerCase().replace(/\s/g, '-')}.txt`] = `${e.role} at ${e.company}\n${e.period}\n\n${e.description}`;
          return acc;
        }, {})
      },
    }
  };
}

function getNode(fs: any, absPath: string): any {
  const parts = absPath.split('/').filter(Boolean);
  let node = fs;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return null;
  }
  return node;
}

// ── Neofetch ────────────────────────────────────────────────────────────────
function buildNeofetch(profile: any) {
  const a   = profile?.about || {};
  const exp = (profile?.experience || []).find((e: any) => e.current || e.company?.toLowerCase().includes('vertex'));
  const skills = (profile?.skills?.technical || []).slice(0, 5).map((s: any) => s.name).join(', ');
  return `<span style="color:#00ff41">   ██████╗ ██████╗  █████╗ ██╗   ██╗</span>    <span style="color:#00ff41;font-weight:bold">pravakar</span><span style="color:#e5e5e5">@prav-pc</span>
<span style="color:#00ff41">   ██╔══██╗██╔══██╗██╔══██╗██║   ██║</span>    <span style="color:#666">──────────────────────────</span>
<span style="color:#00ff41">   ██████╔╝██████╔╝███████║██║   ██║</span>    <span style="color:#f9c74f">OS</span>: Linux x86_64
<span style="color:#00ff41">   ██╔═══╝ ██╔══██╗██╔══██║╚██╗ ██╔╝</span>    <span style="color:#f9c74f">Role</span>: ${a.title || '.NET Developer'}
<span style="color:#00ff41">   ██║     ██║  ██║██║  ██║ ╚████╔╝ </span>    <span style="color:#f9c74f">Location</span>: ${a.location || 'Kathmandu, Nepal'}
<span style="color:#00ff41">   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  </span>    <span style="color:#f9c74f">Kernel</span>: .NET 8.0
                                        <span style="color:#f9c74f">Shell</span>: C# / ASP.NET Core
                                        <span style="color:#f9c74f">Company</span>: ${exp?.company || 'Vertex Special Technology'}
                                        <span style="color:#f9c74f">Uptime</span>: Since 2021
                                        <span style="color:#f9c74f">Stack</span>: ${skills || 'C#, .NET, React, SQL'}`;
}

// ── Weather helpers ──────────────────────────────────────────────────────────
const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky',       icon: '☀️' },
  1: { label: 'Mainly clear',    icon: '🌤️' },
  2: { label: 'Partly cloudy',   icon: '⛅' },
  3: { label: 'Overcast',        icon: '☁️' },
  45:{ label: 'Foggy',           icon: '🌫️' },
  48:{ label: 'Icy fog',         icon: '🌫️' },
  51:{ label: 'Light drizzle',   icon: '🌦️' },
  61:{ label: 'Light rain',      icon: '🌧️' },
  63:{ label: 'Rain',            icon: '🌧️' },
  65:{ label: 'Heavy rain',      icon: '🌧️' },
  71:{ label: 'Light snow',      icon: '🌨️' },
  80:{ label: 'Showers',         icon: '🌦️' },
  95:{ label: 'Thunderstorm',    icon: '⛈️' },
};
const wmoInfo = (code: number) => WMO_CODES[code] || { label: 'Unknown', icon: '🌡️' };

// ── ASCII art helpers ────────────────────────────────────────────────────────
function cowsay(text: string) {
  const line   = text.slice(0, 60);
  const top    = `_${'_'.repeat(line.length + 2)}_`;
  const bot    = `-${'-'.repeat(line.length + 2)}-`;
  return `<span style="color:#f9c74f"> ${top}\n&lt; ${line} &gt;\n ${bot}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||</span>`;
}

function matrix() {
  const CHARS = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012789Z'.split('');
  const rows   = 12;
  const cols   = 48;
  const lines  = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const ch    = CHARS[Math.floor(Math.random() * CHARS.length)];
      const bright = Math.random() > 0.85;
      line += `<span style="color:${bright ? '#ffffff' : '#00ff41'};opacity:${(0.3 + Math.random() * 0.7).toFixed(2)}">${ch} </span>`;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function sl() {
  return `<span style="color:#f9c74f">      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|      _________________
   /     |  |   H  |  |     |   |         ||_| |_||     _|                \\_____A
  |      |  |   H  |__--------------------| [___] |   =|                        |
  | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |
  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_
 |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|
  \\_/      \\_O=====O=====O=====O/      \\_/               \\_/   \\_/    \\_/   \\_/</span>`;
}

const FORTUNES = [
  '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
  '"First, solve the problem. Then, write the code." — John Johnson',
  '"Experience is the name everyone gives to their mistakes." — Oscar Wilde',
  '"In order to be irreplaceable, one must always be different." — Coco Chanel',
  '"Java is to JavaScript what Car is to Carpet." — Chris Heilmann',
  '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson',
  '"The best way to predict the future is to invent it." — Alan Kay',
  '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
  '"Premature optimization is the root of all evil." — Donald Knuth',
  '"It works on my machine." — Every developer, ever',
  '"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton',
  '"Software is like entropy: It always increases." — Norman Augustine',
];

const GIT_LOG = [
  { hash: 'a3f9c21', msg: 'feat: add multi-tenant support to NumAIrik',         date: '2025-04-28', author: 'Pravakar Rijal' },
  { hash: 'b8e1d70', msg: 'fix: resolve JWT refresh token race condition',        date: '2025-04-22', author: 'Pravakar Rijal' },
  { hash: 'c2a4f83', msg: 'refactor: extract IRepository pattern across modules', date: '2025-04-15', author: 'Pravakar Rijal' },
  { hash: 'd91b2e4', msg: 'feat: implement 2FA via TOTP in NumAIrik',             date: '2025-04-08', author: 'Pravakar Rijal' },
  { hash: 'e7c8a11', msg: 'feat: add RBAC middleware to yAIntra HRMS',            date: '2025-03-30', author: 'Pravakar Rijal' },
  { hash: 'f4d3b92', msg: 'docs: update API documentation with Swagger UI',       date: '2025-03-22', author: 'Pravakar Rijal' },
  { hash: '9a1e5f0', msg: 'perf: optimize EF Core queries with compiled models',  date: '2025-03-14', author: 'Pravakar Rijal' },
  { hash: '1b6c4d8', msg: 'feat: git clone via SSH/HTTPS in vStellar IDE',        date: '2025-02-28', author: 'Pravakar Rijal' },
  { hash: '2e7f3a9', msg: 'chore: upgrade to .NET 8 and C# 12',                  date: '2025-02-10', author: 'Pravakar Rijal' },
  { hash: '3c8d5b0', msg: 'init: initial commit 🎉',                              date: '2021-08-01', author: 'Pravakar Rijal' },
];

const ALL_COMMANDS = [
  'help','clear','pwd','cd','ls','cat','touch','mkdir','rm','cp','mv',
  'echo','date','uname','uptime','whoami','hostname','env','history',
  'grep','tree','man','cal','neofetch','skills','projects','contact',
  'open','ai','ping','curl','notes','exit','export','which','head','tail','wc',
  'github','weather','joke','quote','hack','speedtest','matrix','cowsay',
  'fortune','coderank','banner','sl','git','sudo','admin','secrets',
];

const WALLPAPER_NAMES = ['stars', 'nebula', 'sunset', 'matrix', 'dark'];

export default function Terminal({
  profileData,
  openApp,
  onUnlockNotes,
  onWallpaperChange,
}: {
  profileData: any;
  openApp: (app: string) => void;
  onUnlockNotes: () => void;
  onWallpaperChange?: (name: string) => void;
}) {
  const [history,    setHistory]    = useState<HistoryLine[]>([
    { type: 'output-html', content: buildNeofetch(profileData) },
    { type: 'output-html', content: 'Type <span style="color:#00ff41">help</span> to explore. Type <span style="color:#00ff41">coderank</span> to measure your 10x score.' },
    { type: 'system', content: '' },
  ]);
  const [input,      setInput]      = useState('');
  const [cwd,        setCwd]        = useState('/home/pravakar');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx,    setHistIdx]    = useState(-1);
  const [pending,    setPending]    = useState<Pending>(null);
  const [tabCands,   setTabCands]   = useState<string[]>([]);
  const [envVars]                   = useState<Record<string, string>>({
    HOME: '/home/pravakar', USER: 'pravakar', SHELL: '/bin/zsh',
    EDITOR: 'nano', TERM: 'xterm-256color', LANG: 'en_US.UTF-8',
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileData) {
      setHistory(prev => { const c = [...prev]; c[0] = { type: 'output-html', content: buildNeofetch(profileData) }; return c; });
    }
  }, [profileData]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const fs   = profileData ? buildFS(profileData) : null;

  const push = useCallback((...lines: HistoryLine[]) => {
    setHistory(prev => [...prev, ...lines]);
  }, []);

  const resolvePath = (path: string) => {
    if (!path || path === '~') return '/home/pravakar';
    if (path.startsWith('/'))  return path;
    if (path === '..')  { const p = cwd.split('/').filter(Boolean); p.pop(); return '/' + (p.join('/') || ''); }
    if (path === '.')   return cwd;
    return `${cwd}/${path}`.replace(/\/+/g, '/');
  };

  const tabComplete = useCallback((val: string) => {
    const parts = val.split(' ');
    if (parts.length === 1) {
      const prefix  = parts[0].toLowerCase();
      const matches = ALL_COMMANDS.filter(c => c.startsWith(prefix));
      if (matches.length === 1) { setInput(matches[0]); setTabCands([]); }
      else if (matches.length > 1) setTabCands(matches);
    }
  }, []);

  // Animated push: adds lines with delay (for hack, speedtest, etc.)
  const pushDelayed = useCallback((lines: string[], delay = 280) => {
    lines.forEach((content, i) => {
      setTimeout(() => setHistory(prev => [...prev, { type: 'output-html', content }]), i * delay);
    });
  }, []);

  const handleCommand = useCallback(async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    setTabCands([]);

    // ── PIN mode ────────────────────────────────────────────────────────────
    if (pending === 'notes_pin') {
      push({ type: 'output-html', content: `<span style="color:#00ff41">🔒 PIN:</span> ••••` });
      if (trimmed === NOTES_PIN) {
        push({ type: 'system', content: '✓ Access granted. Opening Notes…' });
        onUnlockNotes();
      } else {
        push({ type: 'error', content: '✗ Wrong PIN. Access denied.' });
      }
      setPending(null);
      return;
    }

    if (!trimmed) { push({ type: 'output-html', content: '' }); return; }

    setCmdHistory(prev => [trimmed, ...prev.filter(c => c !== trimmed)]);
    setHistIdx(-1);
    push({ type: 'output-html', content: `<span style="color:#00ff41">pravakar@prav-pc</span>:<span style="color:#5b9bf8">${cwd}</span>$ ${trimmed}` });

    const args   = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const cmd    = args[0].toLowerCase();
    const rawArg = args.slice(1).join(' ').replace(/^["']|["']$/g, '');

    switch (cmd) {

      // ── Filesystem ────────────────────────────────────────────────────────
      case 'pwd':   push({ type: 'output', content: cwd }); break;

      case 'cd': {
        const target = resolvePath(rawArg || '~');
        const node   = fs ? getNode(fs, target) : null;
        if (!rawArg || rawArg === '~') setCwd('/home/pravakar');
        else if (node && typeof node === 'object') setCwd(target);
        else push({ type: 'error', content: `cd: ${rawArg}: No such file or directory` });
        break;
      }

      case 'ls': {
        const target = resolvePath(rawArg || '');
        const node   = fs ? getNode(fs, target) : null;
        if (node && typeof node === 'object') {
          const entries = Object.entries(node).map(([k, v]) => {
            const isDir = typeof v === 'object' && v !== null;
            if (isDir)             return `<span style="color:#5b9bf8;font-weight:bold">${k}/</span>`;
            if (k.endsWith('.md')) return `<span style="color:#f9c74f">${k}</span>`;
            return `<span style="color:#e5e5e5">${k}</span>`;
          });
          push({ type: 'output-html', content: entries.join('  ') || '<span style="color:#555">empty directory</span>' });
        } else {
          push({ type: 'output', content: 'about.txt  skills.txt  contact.txt  README.md  projects/  experience/' });
        }
        break;
      }

      case 'cat': {
        if (!rawArg) { push({ type: 'error', content: 'cat: missing file operand' }); break; }
        const node = fs ? getNode(fs, resolvePath(rawArg)) : null;
        if (typeof node === 'string')              push({ type: 'output', content: node });
        else if (node && typeof node === 'object') push({ type: 'error', content: `cat: ${rawArg}: Is a directory` });
        else                                       push({ type: 'error', content: `cat: ${rawArg}: No such file or directory` });
        break;
      }

      case 'head': case 'tail': {
        const node = fs ? getNode(fs, resolvePath(rawArg)) : null;
        if (typeof node === 'string') {
          const lines = node.split('\n');
          push({ type: 'output', content: (cmd === 'head' ? lines.slice(0, 10) : lines.slice(-10)).join('\n') });
        } else push({ type: 'error', content: `${cmd}: ${rawArg}: No such file` });
        break;
      }

      case 'wc': {
        const node = fs ? getNode(fs, resolvePath(rawArg)) : null;
        if (typeof node === 'string')
          push({ type: 'output', content: `  ${node.split('\n').length}  ${node.split(/\s+/).filter(Boolean).length}  ${node.length} ${rawArg}` });
        else push({ type: 'error', content: `wc: ${rawArg}: No such file` });
        break;
      }

      case 'grep': {
        const [pattern, ...fileParts] = rawArg.split(' ');
        const node = fs ? getNode(fs, resolvePath(fileParts.join(' '))) : null;
        if (!pattern) { push({ type: 'error', content: 'grep: missing pattern' }); break; }
        if (typeof node === 'string') {
          const regex   = new RegExp(pattern, 'gi');
          const matches = node.split('\n').filter(l => regex.test(l));
          if (matches.length) push({ type: 'output', content: matches.join('\n') });
        } else push({ type: 'error', content: `grep: ${fileParts.join(' ')}: No such file` });
        break;
      }

      case 'tree': {
        const node = fs ? getNode(fs, resolvePath(rawArg || '')) : null;
        if (!node || typeof node !== 'object') { push({ type: 'error', content: `tree: '${rawArg}': No such directory` }); break; }
        const renderTree = (n: any, prefix = '', depth = 0): string => {
          if (depth > 3) return '';
          return Object.entries(n).map(([k, v], i, arr) => {
            const isLast = i === arr.length - 1;
            const conn   = isLast ? '└── ' : '├── ';
            const child  = isLast ? '    ' : '│   ';
            const isDir  = typeof v === 'object' && v !== null;
            const name   = isDir ? `<span style="color:#5b9bf8;font-weight:bold">${k}/</span>` : `<span style="color:#e5e5e5">${k}</span>`;
            return `${prefix}${conn}${name}${isDir ? '\n' + renderTree(v, prefix + child, depth + 1) : ''}`;
          }).join('\n');
        };
        push({ type: 'output-html', content: `<span style="color:#5b9bf8">${cwd}</span>\n${renderTree(node)}` });
        break;
      }

      case 'touch': push({ type: 'system', content: `touch: created '${rawArg}' (simulated)` }); break;
      case 'mkdir': push({ type: 'system', content: `mkdir: created directory '${rawArg}' (simulated)` }); break;
      case 'rm':    push({ type: 'system', content: `rm: removed '${rawArg}' (simulated)` }); break;
      case 'cp': case 'mv': {
        const [src, dst] = rawArg.split(' ');
        if (!src || !dst) { push({ type: 'error', content: `${cmd}: missing operand` }); break; }
        push({ type: 'system', content: `${cmd}: '${src}' → '${dst}' (simulated)` });
        break;
      }

      // ── System ────────────────────────────────────────────────────────────
      case 'echo':    push({ type: 'output', content: rawArg.replace(/\$(\w+)/g, (_, k) => envVars[k] || '') }); break;
      case 'export':  push({ type: 'system', content: `export: ${rawArg} (session only)` }); break;
      case 'env':     push({ type: 'output', content: Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n') }); break;
      case 'which':   push({ type: 'output', content: ALL_COMMANDS.includes(rawArg) ? `/usr/bin/${rawArg}` : '' }); break;
      case 'date':    push({ type: 'output', content: new Date().toString() }); break;
      case 'uname':   push({ type: 'output', content: rawArg === '-a' ? 'Linux prav-pc 6.6.0-arch1 #1 SMP x86_64 GNU/Linux' : 'Linux' }); break;
      case 'uptime':  push({ type: 'output', content: `${new Date().toLocaleTimeString()} up 2:37,  1 user,  load average: 0.12, 0.08, 0.05` }); break;
      case 'exit':    push({ type: 'system', content: 'logout' }); break;

      case 'whoami': {
        const a    = profileData?.about || {};
        const name = a.name || 'Pravakar Rijal';
        const role = a.title || '.NET Developer';
        const loc  = a.location || 'Kathmandu, Nepal';
        push({ type: 'output-html', content:
`<span style="color:#00ff41">╔══════════════════════════════════════════╗
║                                          ║
║   <span style="color:#ffffff;font-weight:bold">${name.padEnd(38)}</span><span style="color:#00ff41">  ║</span>
║   <span style="color:#f9c74f">${role.padEnd(40)}</span><span style="color:#00ff41">║</span>
║   <span style="color:#8b949e">${loc.padEnd(40)}</span><span style="color:#00ff41">║</span>
║                                          ║
╟──────────────────────────────────────────╢
║  <span style="color:#f9c74f">UID</span>=1337   <span style="color:#f9c74f">GID</span>=elite   <span style="color:#f9c74f">Groups</span>=10x       ║
║  <span style="color:#f9c74f">Shell</span>: C# / ASP.NET Core                ║
║  <span style="color:#f9c74f">Editor</span>: Rider / VS 2022                 ║
║  <span style="color:#f9c74f">Coffee</span>: ∞ cups / day                    ║
║  <span style="color:#f9c74f">Clearance</span>: BACKEND OPERATIVE            ║
╟──────────────────────────────────────────╢
║  <span style="color:#555">Try: coderank • github • weather • hack</span>   ║
╚══════════════════════════════════════════╝</span>` });
        break;
      }

      case 'hostname':push({ type: 'output', content: 'prav-pc' }); break;

      case 'history': {
        push({ type: 'output-html', content: [...cmdHistory].reverse().slice(0, 20).map((c, i) =>
          `<span style="color:#555">${String(i + 1).padStart(3)}</span>  ${c}`
        ).join('\n') || '<span style="color:#555">No history</span>' });
        break;
      }

      case 'cal': {
        const now = new Date();
        const m = now.getMonth(); const y = now.getFullYear();
        const first = new Date(y, m, 1).getDay();
        const days  = new Date(y, m + 1, 0).getDate();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        let out = `<span style="color:#f9c74f">${months[m]} ${y}</span>\n<span style="color:#888">Su Mo Tu We Th Fr Sa</span>\n`;
        let line = '   '.repeat(first);
        for (let d = 1; d <= days; d++) {
          const isToday = d === now.getDate();
          line += isToday ? `<span style="color:#00ff41;font-weight:bold">${String(d).padStart(2)}</span> ` : `${String(d).padStart(2)} `;
          if ((first + d) % 7 === 0) { out += line + '\n'; line = ''; }
        }
        if (line.trim()) out += line;
        push({ type: 'output-html', content: out });
        break;
      }

      case 'ping': {
        const host = rawArg || 'localhost';
        push({ type: 'output', content: `PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=64 time=${(Math.random()*8+2).toFixed(1)} ms\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=${(Math.random()*8+2).toFixed(1)} ms\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=${(Math.random()*8+2).toFixed(1)} ms\n\n--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss` });
        break;
      }

      case 'curl': push({ type: 'system', content: `curl: fetching ${rawArg}… (use the browser for real HTTP requests)` }); break;

      case 'sudo': {
        if (rawArg === 'su' || rawArg === 'su -') {
          push({ type: 'output-html', content: '<span style="color:#f9c74f">🔐 Elevating to root...</span>' });
          setTimeout(() => push({ type: 'output-html', content: '<span style="color:#00ff41">root@prav-pc# </span><span style="color:#e5e5e5">Oh wait, you\'re already a 10x developer. That\'s higher than root.</span>' }), 600);
        } else {
          push({ type: 'error', content: `sudo: ${rawArg}: command not found` });
        }
        break;
      }

      case 'man': {
        const pages: Record<string, string> = {
          ls: 'ls - list directory contents\nUsage: ls [path]',
          cat: 'cat - print file contents\nUsage: cat <file>',
          grep: 'grep - search for pattern\nUsage: grep <pattern> <file>',
          tree: 'tree - show directory tree\nUsage: tree [path]',
          ai: 'ai - ask AI assistant\nUsage: ai "your question"',
          open: 'open - launch app\nUsage: open <browser|files|pomodoro|todo|resume>',
          notes: 'notes - unlock notes app\nUsage: notes\n(PIN required)',
          cowsay: 'cowsay - ASCII cow\nUsage: cowsay <message>',
          coderank: 'coderank - measure your developer score\nUsage: coderank',
          weather: 'weather - live Kathmandu weather\nUsage: weather',
          github: 'github - live GitHub profile\nUsage: github',
          hack: 'hack - initiate hack sequence\nUsage: hack',
          matrix: 'matrix - enter the matrix\nUsage: matrix',
          git: 'git - version control\nUsage: git <log|status|diff|branch|stash>',
        };
        if (pages[rawArg]) push({ type: 'output-html', content: `<span style="color:#f9c74f">MANUAL: ${rawArg}</span>\n\n${pages[rawArg]}` });
        else push({ type: 'error', content: `man: no manual entry for '${rawArg}'` });
        break;
      }

      case 'clear':
        setHistory([]);
        break;

      case 'neofetch': push({ type: 'output-html', content: buildNeofetch(profileData) }); break;

      // ── Portfolio ──────────────────────────────────────────────────────────
      case 'skills': {
        const skills = profileData?.skills?.technical || [];
        if (skills.length) {
          const bars = skills.map((s: any) => {
            const filled = '█'.repeat(s.level || 3);
            const empty  = '░'.repeat(5 - (s.level || 3));
            const color  = (s.level || 3) >= 4 ? '#00ff41' : '#f9c74f';
            return `<span style="color:${color}">${filled}${empty}</span>  <span style="color:#e5e5e5">${s.name}</span>  <span style="color:#555">${s.level}/5</span>  <span style="color:#444">[${s.category}]</span>`;
          });
          push({ type: 'output-html', content: bars.join('\n') });
        } else {
          push({ type: 'output', content: 'C#: 5/5  .NET Core: 4/5  SQL Server: 4/5' });
        }
        break;
      }

      case 'projects': {
        const projects = profileData?.projects || [];
        if (projects.length) {
          const out = projects.map((p: any) =>
            `<span style="color:#00ff41;font-weight:bold">${p.name}</span>\n` +
            `  <span style="color:#aaa">${(p.description || '').slice(0, 80)}${(p.description?.length || 0) > 80 ? '…' : ''}</span>\n` +
            `  <span style="color:#5b9bf8">${(p.tech || []).join(' · ')}</span>`
          ).join('\n\n');
          push({ type: 'output-html', content: out });
        } else { push({ type: 'output', content: 'vStellar, yAIntra, NumAIrik' }); }
        break;
      }

      case 'contact': {
        const a = profileData?.about || {};
        push({ type: 'output-html', content:
          `<span style="color:#f9c74f">Email:   </span> ${a.email    || 'pravakarrijal11@gmail.com'}\n` +
          `<span style="color:#f9c74f">Phone:   </span> ${a.phone    || '+977-9815185130'}\n` +
          `<span style="color:#f9c74f">LinkedIn:</span> ${a.linkedin || 'linkedin.com/in/pravakar-rijal/'}\n` +
          `<span style="color:#f9c74f">GitHub:  </span> ${a.github   || 'github.com/pravakarrijal'}`
        });
        break;
      }

      case 'open': {
        const app = rawArg.toLowerCase();
        const valid: Record<string, string> = {
          browser: 'browser', files: 'files', resume: 'resume',
          pomodoro: 'pomodoro', todo: 'todo',
        };
        if (valid[app]) { openApp(valid[app]); push({ type: 'system', content: `Opening ${app}…` }); }
        else if (app === 'notes') {
          push({ type: 'output-html', content: '<span style="color:#f9c74f">🔒 Notes requires authentication. Use: <span style="color:#00ff41">notes</span></span>' });
        }
        else push({ type: 'error', content: `open: unknown app '${app}'\nAvailable: browser, files, resume, notes, pomodoro, todo` });
        break;
      }

      case 'notes':
        push({ type: 'output-html', content: '<span style="color:#f9c74f">🔒 Notes requires authentication.</span>' });
        push({ type: 'system', content: 'Enter your PIN (input is hidden):' });
        setPending('notes_pin');
        break;

      // ── Admin (secret) ─────────────────────────────────────────────────────
      case 'wallpaper': {
        const wpArg = rawArg.toLowerCase();
        if (!wpArg) {
          push({ type: 'output-html', content:
`<span style="color:#f9c74f">Available wallpapers:</span>
  <span style="color:#00ff41">stars</span>   🌌 Star field (default)
  <span style="color:#00ff41">nebula</span>  🔮 Purple nebula
  <span style="color:#00ff41">sunset</span>  🌅 Warm sunset
  <span style="color:#00ff41">matrix</span>  🟩 Matrix grid
  <span style="color:#00ff41">dark</span>    ⬛ Pure dark
<span style="color:#555">Usage: wallpaper <name></span>` });
        } else if (WALLPAPER_NAMES.includes(wpArg)) {
          onWallpaperChange?.(wpArg);
          push({ type: 'system', content: `Wallpaper set to: ${wpArg}` });
        } else {
          push({ type: 'error', content: `wallpaper: unknown theme '${wpArg}'. Try: ${WALLPAPER_NAMES.join(', ')}` });
        }
        break;
      }

      case 'admin':
        push({ type: 'output-html', content: '<span style="color:#ef4444">⚡ Launching Super Admin Panel…</span>' });
        setTimeout(() => { window.location.href = '/admin'; }, 600);
        break;

      case 'secrets':
        push({ type: 'output-html', content:
`<span style="color:#ef4444">╔══════════════════════════════════════════╗</span>
<span style="color:#ef4444">║</span>  <span style="color:#ffffff;font-weight:bold">🔐 Admin Commands — EYES ONLY</span>          <span style="color:#ef4444">║</span>
<span style="color:#ef4444">╚══════════════════════════════════════════╝</span>
<span style="color:#f9c74f">  admin      </span><span style="color:#8b949e">→ Open Super Admin Panel (full CMS)</span>
<span style="color:#f9c74f">  notes      </span><span style="color:#8b949e">→ Unlock hidden Notes (PIN required)</span>
<span style="color:#f9c74f">  wallpaper  </span><span style="color:#8b949e">→ Change desktop wallpaper</span>
<span style="color:#f9c74f">  secrets    </span><span style="color:#8b949e">→ Show this list</span>
<span style="color:#555">  ─────────────────────────────────────────</span>
<span style="color:#555">  These commands are not listed in help.</span>` });
        break;

      // ── AI ────────────────────────────────────────────────────────────────
      case 'ai': {
        if (!rawArg) { push({ type: 'error', content: `Usage: ai "your question"` }); break; }
        push({ type: 'ai-loading', content: '● AI is thinking…' });
        try {
          const res = await api.ai.chat(rawArg);
          setHistory(prev => [
            ...prev.filter(h => h.type !== 'ai-loading'),
            { type: 'ai', content: res.response }
          ]);
        } catch {
          setHistory(prev => [...prev.filter(h => h.type !== 'ai-loading'), { type: 'error', content: 'AI request failed.' }]);
        }
        break;
      }

      // ── Live API commands ──────────────────────────────────────────────────
      case 'github': {
        push({ type: 'system', content: '⧗ Fetching live GitHub profile…' });
        try {
          const [user, repos] = await Promise.all([
            fetch('https://api.github.com/users/pravakarrijal').then(r => r.json()),
            fetch('https://api.github.com/users/pravakarrijal/repos?sort=updated&per_page=6').then(r => r.json()),
          ]);
          setHistory(prev => prev.filter(h => h.type !== 'system' || h.content !== '⧗ Fetching live GitHub profile…'));
          const repoLines = (Array.isArray(repos) ? repos : []).slice(0, 6).map((r: any) =>
            `  <span style="color:#58a6ff">📁 ${r.name}</span>  <span style="color:#555">⭐${r.stargazers_count} 🍴${r.forks_count}</span>  <span style="color:#8b949e">${r.language || ''}</span>\n     <span style="color:#555">${(r.description || 'no description').slice(0, 60)}</span>`
          ).join('\n');
          push({ type: 'output-html', content:
`<span style="color:#f9c74f">━━━ GitHub: ${user.login} ━━━━━━━━━━━━━━━━━━━━━━━━━</span>
<span style="color:#e5e5e5">${user.name || user.login}</span>  <span style="color:#555">${user.bio || ''}</span>
<span style="color:#8b949e">📍 ${user.location || 'Earth'}  🔗 ${user.blog || ''}</span>

<span style="color:#f9c74f">Followers:</span> ${user.followers}  <span style="color:#f9c74f">Following:</span> ${user.following}  <span style="color:#f9c74f">Repos:</span> ${user.public_repos}
<span style="color:#f9c74f">Member since:</span> ${new Date(user.created_at).toLocaleDateString()}

<span style="color:#f9c74f">Recent Repositories:</span>
${repoLines}

<span style="color:#555">→ github.com/pravakarrijal</span>` });
        } catch {
          setHistory(prev => prev.filter(h => h.content !== '⧗ Fetching live GitHub profile…'));
          push({ type: 'error', content: 'GitHub API unavailable (rate limit or network error)' });
        }
        break;
      }

      case 'weather': {
        push({ type: 'system', content: '⧗ Fetching weather for Kathmandu, Nepal…' });
        try {
          const res  = await fetch('https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&current_weather=true&hourly=relativehumidity_2m&timezone=Asia%2FKathmandu');
          const data = await res.json();
          const cw   = data.current_weather;
          const info = wmoInfo(cw.weathercode);
          const humidity = data.hourly?.relativehumidity_2m?.[0] || '—';
          setHistory(prev => prev.filter(h => h.content !== '⧗ Fetching weather for Kathmandu, Nepal…'));
          push({ type: 'output-html', content:
`<span style="color:#5b9bf8">━━━ Weather: Kathmandu, Nepal 🇳🇵 ━━━━━━━━━━━━</span>
  ${info.icon} <span style="color:#e5e5e5;font-weight:bold">${info.label}</span>
  <span style="color:#f9c74f">Temperature:</span> ${cw.temperature}°C
  <span style="color:#f9c74f">Wind speed: </span> ${cw.windspeed} km/h
  <span style="color:#f9c74f">Humidity:   </span> ${humidity}%
  <span style="color:#555">Updated: ${new Date().toLocaleTimeString()}</span>` });
        } catch {
          setHistory(prev => prev.filter(h => h.content !== '⧗ Fetching weather for Kathmandu, Nepal…'));
          push({ type: 'error', content: 'Weather API unavailable' });
        }
        break;
      }

      case 'joke': {
        push({ type: 'system', content: '⧗ Loading a programming joke…' });
        try {
          const res  = await fetch('https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw,racist,sexist,explicit');
          const data = await res.json();
          setHistory(prev => prev.filter(h => h.content !== '⧗ Loading a programming joke…'));
          if (data.type === 'single') {
            push({ type: 'output-html', content: `<span style="color:#f9c74f">😄 ${data.joke}</span>` });
          } else {
            push({ type: 'output-html', content: `<span style="color:#f9c74f">😄 Q: ${data.setup}\n\n   A: ${data.delivery}</span>` });
          }
        } catch {
          setHistory(prev => prev.filter(h => h.content !== '⧗ Loading a programming joke…'));
          push({ type: 'output-html', content: '<span style="color:#f9c74f">😄 Why do programmers prefer dark mode?\n\n   Because light attracts bugs.</span>' });
        }
        break;
      }

      case 'quote': {
        const q = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        push({ type: 'output-html', content: `<span style="color:#c9d1d9">"${q.split('"').filter(Boolean)[0] || q}"</span>\n<span style="color:#555">  — ${q.split('—')[1]?.trim() || 'Unknown'}</span>` });
        break;
      }

      // ── Fun / animated ─────────────────────────────────────────────────────
      case 'hack': {
        pushDelayed([
          '<span style="color:#00ff41">◈ INITIATING HACK SEQUENCE...</span>',
          `<span style="color:#555">${Array.from({length:40},() => Math.floor(Math.random()*16).toString(16)).join('')}</span>`,
          '<span style="color:#f9c74f">[▓▓▓░░░░░░░░░░░░] 20% — Probing target...</span>',
          `<span style="color:#555">${Array.from({length:40},() => Math.floor(Math.random()*16).toString(16)).join('')}</span>`,
          '<span style="color:#f9c74f">[▓▓▓▓▓▓░░░░░░░░░] 43% — Bypassing firewall...</span>',
          `<span style="color:#555">${Array.from({length:40},() => Math.floor(Math.random()*16).toString(16)).join('')}</span>`,
          '<span style="color:#f9c74f">[▓▓▓▓▓▓▓▓▓░░░░░░] 65% — Cracking AES-256...</span>',
          '<span style="color:#f9c74f">[▓▓▓▓▓▓▓▓▓▓▓▓░░░] 86% — Injecting payload...</span>',
          '<span style="color:#f9c74f">[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100% — DONE</span>',
          '',
          '<span style="color:#00ff41;font-weight:bold">✓ ACCESS GRANTED — Welcome back, Pravakar.</span>',
          '<span style="color:#555">(it\'s a portfolio, there\'s nothing to hack 🙂)</span>',
        ], 240);
        break;
      }

      case 'speedtest': {
        pushDelayed([
          '<span style="color:#5b9bf8">⣿ Finding nearest server...</span>',
          '<span style="color:#5b9bf8">⣿ Server: Singapore  ·  Distance: 2,847 km</span>',
          '',
          '<span style="color:#f9c74f">↓ Testing download:</span>',
          '<span style="color:#555">[▓▓▓▓▓░░░░░░░░░░] 34% ...</span>',
          '<span style="color:#555">[▓▓▓▓▓▓▓▓▓▓░░░░░] 66% ...</span>',
          '<span style="color:#555">[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%</span>',
          `<span style="color:#00ff41">↓ Download: ${(600 + Math.random()*300).toFixed(0)} Mbps ✓</span>`,
          '',
          '<span style="color:#f9c74f">↑ Testing upload:</span>',
          '<span style="color:#555">[▓▓▓▓▓▓▓░░░░░░░░] 45% ...</span>',
          '<span style="color:#555">[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%</span>',
          `<span style="color:#00ff41">↑ Upload: ${(200 + Math.random()*200).toFixed(0)} Mbps ✓</span>`,
          '',
          `<span style="color:#f9c74f">Ping: ${(3 + Math.random()*8).toFixed(0)} ms  Jitter: ${(Math.random()*2).toFixed(1)} ms</span>`,
          '<span style="color:#00ff41;font-weight:bold">🚀 Result: 10x Developer Internet — No excuses for slow builds.</span>',
        ], 200);
        break;
      }

      case 'matrix': {
        push({ type: 'output-html', content: matrix() });
        push({ type: 'output-html', content: '<span style="color:#555">There is no spoon.</span>' });
        break;
      }

      case 'cowsay': {
        const msg = rawArg || 'Moo! Backend devs are cool.';
        push({ type: 'output-html', content: cowsay(msg) });
        break;
      }

      case 'fortune': {
        const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        push({ type: 'output-html', content: `<span style="color:#c9d1d9;font-style:italic">${f}</span>` });
        break;
      }

      case 'sl': {
        push({ type: 'output-html', content: sl() });
        push({ type: 'output-html', content: '<span style="color:#555">choo choo 🚂</span>' });
        break;
      }

      case 'coderank': {
        const coffeeLevel = (Math.random() * 10 + 8).toFixed(1);
        const score       = (Math.random() * 2 + 9.2).toFixed(1);
        pushDelayed([
          '<span style="color:#f9c74f">◈ Analyzing developer metrics...</span>',
          '',
          '<span style="color:#00ff41">━━━━━━━━━━━ DEVELOPER METRICS ━━━━━━━━━━</span>',
          `<span style="color:#f9c74f">Stack depth:        </span><span style="color:#00ff41">████████████</span> 12/10 (overflow)`,
          `<span style="color:#f9c74f">Commit frequency:   </span><span style="color:#00ff41">████████████</span> 847/week`,
          `<span style="color:#f9c74f">Bug density:        </span><span style="color:#00ff41">░░░░░░░░░░░░</span> 0.001%`,
          `<span style="color:#f9c74f">Coffee consumed:    </span><span style="color:#00ff41">████████████</span> ${coffeeLevel} cups/day`,
          `<span style="color:#f9c74f">Stack Overflow:     </span><span style="color:#00ff41">████████████</span> asked 0, answered ∞`,
          `<span style="color:#f9c74f">Imposter syndrome:  </span><span style="color:#00ff41">░░░░░░░░░░░░</span> 0%`,
          `<span style="color:#f9c74f">Dark mode:          </span><span style="color:#00ff41">████████████</span> always`,
          `<span style="color:#f9c74f">Tabs vs Spaces:     </span><span style="color:#00ff41">████████████</span> both (controversial)`,
          '<span style="color:#00ff41">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>',
          `<span style="color:#ffffff;font-weight:bold">⚡ FINAL SCORE: ${score} / 10 — CERTIFIED 10X DEVELOPER</span>`,
          '<span style="color:#555">Badge: sudo apt install 10x-badge (already installed)</span>',
        ], 180);
        break;
      }

      case 'banner': {
        const txt = (rawArg || 'PRAV').toUpperCase().slice(0, 6);
        const FONT: Record<string, string[]> = {
          'P': ['██████','██  ██','██████','██    ','██    '],
          'R': ['██████','██  ██','██████','██ ██ ','██  ██'],
          'A': [' ████ ','██  ██','██████','██  ██','██  ██'],
          'V': ['██  ██','██  ██',' ████ ',' ████ ','  ██  '],
          'K': ['██  ██','██ ██ ','████  ','██ ██ ','██  ██'],
          'X': ['██  ██',' ████ ','  ██  ',' ████ ','██  ██'],
          'Z': ['██████','   ███','  ██  ','███   ','██████'],
        };
        const charLines = Array.from(txt).map(c => FONT[c] || ['██████','██████','██████','██████','██████']);
        const rows = Array.from({length:5},(_,r) => charLines.map(cl => cl[r]).join('  '));
        push({ type: 'output-html', content: `<span style="color:#00ff41">${rows.join('\n')}</span>` });
        break;
      }

      case 'git': {
        const sub = args[1]?.toLowerCase();
        if (!sub || sub === 'log') {
          push({ type: 'output-html', content: GIT_LOG.map((c, i) =>
            `<span style="color:#f9c74f">commit ${c.hash}</span><span style="color:#555"> (${i === 0 ? 'HEAD → main' : ''})</span>\n` +
            `<span style="color:#8b949e">Author: ${c.author} &lt;pravakarrijal11@gmail.com&gt;</span>\n` +
            `<span style="color:#8b949e">Date:   ${c.date}</span>\n\n` +
            `    <span style="color:#e5e5e5">${c.msg}</span>`
          ).join('\n\n') });
        } else if (sub === 'status') {
          push({ type: 'output-html', content:
`<span style="color:#00ff41">On branch main</span>
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

<span style="color:#555">Last commit: ${GIT_LOG[0].msg}</span>` });
        } else if (sub === 'branch') {
          push({ type: 'output-html', content: `<span style="color:#00ff41">* main</span>\n  dev\n  feature/multi-tenant\n  hotfix/jwt-refresh` });
        } else if (sub === 'stash') {
          push({ type: 'output', content: 'stash@{0}: WIP on dev: implement EF Core compiled models\nstash@{1}: WIP on dev: 2FA email flow' });
        } else if (sub === 'diff') {
          push({ type: 'output-html', content:
`<span style="color:#8b949e">diff --git a/src/Services/AuthService.cs b/src/Services/AuthService.cs</span>
<span style="color:#f9c74f">--- a/src/Services/AuthService.cs</span>
<span style="color:#00ff41">+++ b/src/Services/AuthService.cs</span>
<span style="color:#8b949e">@@ -42,6 +42,12 @@ public class AuthService : IAuthService</span>
<span style="color:#00ff41">+    private async Task&lt;bool&gt; ValidateTotpCode(string secret, string code)</span>
<span style="color:#00ff41">+    {</span>
<span style="color:#00ff41">+        var totp = new Totp(Base32Encoding.ToBytes(secret));</span>
<span style="color:#00ff41">+        return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);</span>
<span style="color:#00ff41">+    }</span>` });
        } else {
          push({ type: 'error', content: `git: '${sub}' is not a git command. Available: log, status, branch, stash, diff` });
        }
        break;
      }

      // ── Help ───────────────────────────────────────────────────────────────
      case 'help':
        push({ type: 'output-html', content: `
<span style="color:#f9c74f">── Filesystem ───────────────────────────────────</span>
  <span style="color:#00ff41">ls</span> <span style="color:#00ff41">cd</span> <span style="color:#00ff41">cat</span> <span style="color:#00ff41">pwd</span> <span style="color:#00ff41">tree</span> <span style="color:#00ff41">grep</span> <span style="color:#00ff41">head</span> <span style="color:#00ff41">tail</span> <span style="color:#00ff41">wc</span>
  <span style="color:#00ff41">touch</span> <span style="color:#00ff41">mkdir</span> <span style="color:#00ff41">rm</span> <span style="color:#00ff41">cp</span> <span style="color:#00ff41">mv</span>

<span style="color:#f9c74f">── System ───────────────────────────────────────</span>
  <span style="color:#00ff41">date</span> <span style="color:#00ff41">cal</span> <span style="color:#00ff41">uname</span> <span style="color:#00ff41">uptime</span> <span style="color:#00ff41">whoami</span> <span style="color:#00ff41">hostname</span>
  <span style="color:#00ff41">env</span> <span style="color:#00ff41">echo</span> <span style="color:#00ff41">history</span> <span style="color:#00ff41">which</span> <span style="color:#00ff41">man</span> <span style="color:#00ff41">ping</span> <span style="color:#00ff41">curl</span>

<span style="color:#f9c74f">── Portfolio ────────────────────────────────────</span>
  <span style="color:#00ff41">neofetch</span> <span style="color:#00ff41">skills</span> <span style="color:#00ff41">projects</span> <span style="color:#00ff41">contact</span>

<span style="color:#f9c74f">── Live APIs ────────────────────────────────────</span>
  <span style="color:#00ff41">github</span>   <span style="color:#555">— live GitHub profile &amp; repos</span>
  <span style="color:#00ff41">weather</span>  <span style="color:#555">— Kathmandu weather (live)</span>
  <span style="color:#00ff41">joke</span>     <span style="color:#555">— random programming joke (live)</span>

<span style="color:#f9c74f">── Fun ──────────────────────────────────────────</span>
  <span style="color:#00ff41">coderank</span> <span style="color:#00ff41">hack</span> <span style="color:#00ff41">speedtest</span> <span style="color:#00ff41">matrix</span> <span style="color:#00ff41">cowsay</span>
  <span style="color:#00ff41">fortune</span> <span style="color:#00ff41">quote</span> <span style="color:#00ff41">banner</span> <span style="color:#00ff41">sl</span> <span style="color:#00ff41">sudo su</span>

<span style="color:#f9c74f">── Git ──────────────────────────────────────────</span>
  <span style="color:#00ff41">git</span> &lt;log|status|diff|branch|stash&gt;

<span style="color:#f9c74f">── Apps ─────────────────────────────────────────</span>
  <span style="color:#00ff41">open</span> &lt;browser|files|resume|pomodoro|todo&gt;
  <span style="color:#00ff41">ai</span> "question"   <span style="color:#555">AI assistant</span>

<span style="color:#555">Tab: autocomplete  ↑↓: history  Ctrl+L: clear</span>` });
        break;

      default:
        push({ type: 'error', content: `${cmd}: command not found. Type 'help'.` });
    }
  }, [cwd, fs, profileData, openApp, onUnlockNotes, cmdHistory, envVars, pending, push, pushDelayed]);

  const handleEnter = useCallback(() => {
    handleCommand(input);
    setInput('');
  }, [input, handleCommand]);

  return (
    <div
      className="h-full bg-[#0c0c0c] text-gray-300 overflow-y-auto custom-scrollbar p-4 flex flex-col"
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: '1.65' }}
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
      onKeyDown={e => { if (e.ctrlKey && e.key === 'l') { e.preventDefault(); setHistory([]); } }}
      tabIndex={0}
    >
      {/* History */}
      <div className="flex-1">
        {history.map((line, i) => (
          <div key={i} className="mb-0.5">
            {line.type === 'output'      && <div className="text-gray-300 whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'output-html' && <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: line.content }} />}
            {line.type === 'error'       && <div className="text-red-400 whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'system'      && <div className="text-gray-600 whitespace-pre-wrap">{line.content}</div>}
            {line.type === 'ai-loading'  && <div className="text-purple-400 animate-pulse">{line.content}</div>}
            {line.type === 'ai'          && (
              <div className="my-2 p-3 bg-white/5 border border-purple-900/40 rounded text-gray-200 relative">
                <span className="absolute -top-2.5 left-2 bg-[#0c0c0c] px-2 text-[10px] text-purple-400 font-semibold">AI</span>
                <div className="mt-1 whitespace-pre-wrap leading-relaxed">{line.content}</div>
              </div>
            )}
          </div>
        ))}
        {tabCands.length > 0 && <div className="text-gray-600 mb-0.5">{tabCands.join('  ')}</div>}
      </div>

      {/* Prompt */}
      <div className="flex items-center mt-0.5 shrink-0">
        {pending === 'notes_pin' ? (
          <span className="text-yellow-400 mr-2 shrink-0 whitespace-nowrap">🔒 PIN:</span>
        ) : (
          <>
            <span style={{ color: '#00ff41' }} className="mr-1 shrink-0 whitespace-nowrap">pravakar@prav-pc</span>
            <span className="text-gray-500 mr-1">:</span>
            <span style={{ color: '#5b9bf8' }} className="mr-1 shrink-0 whitespace-nowrap">{cwd}</span>
            <span className="text-white mr-2">$</span>
          </>
        )}
        <input
          ref={inputRef}
          type={pending === 'notes_pin' ? 'password' : 'text'}
          value={input}
          onChange={e => { setInput(e.target.value); setTabCands([]); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { handleEnter(); }
            else if (e.key === 'Tab') { e.preventDefault(); tabComplete(input); }
            else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const idx = Math.min(histIdx + 1, cmdHistory.length - 1);
              setHistIdx(idx); setInput(cmdHistory[idx] || '');
            }
            else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const idx = Math.max(histIdx - 1, -1);
              setHistIdx(idx); setInput(idx === -1 ? '' : cmdHistory[idx]);
            }
          }}
          className="flex-1 bg-transparent outline-none text-white"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', caretColor: '#00ff41' }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
