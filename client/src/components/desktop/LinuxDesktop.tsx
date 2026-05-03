import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Chrome, Folder, FileText, File as FileIcon,
  StickyNote, Timer, CheckSquare, X, Minus, Maximize2, Minimize2,
} from 'lucide-react';
import TerminalApp    from './apps/Terminal';
import BrowserApp     from './apps/Browser';
import FileManagerApp from './apps/FileManager';
import NotesApp       from './apps/Notes';
import PomodoroApp    from './apps/Pomodoro';
import TodoApp        from './apps/TodoApp';
import WeatherWidget  from './WeatherWidget';
import MobileView     from './MobileView';
import { api } from '../../api/client';

// ── Mobile detection ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// ── Wallpaper ─────────────────────────────────────────────────────────────────
const WALLPAPERS = ['stars', 'nebula', 'sunset', 'matrix', 'dark'] as const;
type Wallpaper = typeof WALLPAPERS[number];
const WALLPAPER_CLASS: Record<Wallpaper, string> = {
  stars:  'bg-stars',
  nebula: 'bg-nebula',
  sunset: 'bg-sunset',
  matrix: 'bg-matrix',
  dark:   'bg-dark-minimal',
};
const WALLPAPER_LABEL: Record<Wallpaper, string> = {
  stars:  '🌌 Stars',
  nebula: '🔮 Nebula',
  sunset: '🌅 Sunset',
  matrix: '🟩 Matrix',
  dark:   '⬛ Dark',
};
function loadWallpaper(): Wallpaper {
  try { return (localStorage.getItem('prav_wallpaper') as Wallpaper) || 'stars'; }
  catch { return 'stars'; }
}

// ── App types ─────────────────────────────────────────────────────────────────
type AppType = 'terminal' | 'browser' | 'files' | 'readme' | 'resume' | 'notes' | 'pomodoro' | 'todo';

interface AppWindow {
  id: string;
  type: AppType;
  title: string;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  pos:  { x: number; y: number };
  size: { w: number; h: number };
}

const APP_CONFIGS: Record<AppType, { title: string; pos: { x: number; y: number }; size: { w: number; h: number } }> = {
  terminal: { title: 'pravakar@prav-pc:~', pos: { x: 50,  y: 50  }, size: { w: 620, h: 420 } },
  browser:  { title: 'Web Browser',        pos: { x: 120, y: 80  }, size: { w: 920, h: 620 } },
  files:    { title: 'Files',              pos: { x: 160, y: 100 }, size: { w: 820, h: 520 } },
  readme:   { title: 'README.md',          pos: { x: 200, y: 120 }, size: { w: 560, h: 380 } },
  resume:   { title: 'Resume',             pos: { x: 80,  y: 60  }, size: { w: 920, h: 620 } },
  notes:    { title: 'Notes',              pos: { x: 200, y: 100 }, size: { w: 720, h: 500 } },
  pomodoro: { title: 'Pomodoro',           pos: { x: 320, y: 100 }, size: { w: 380, h: 500 } },
  todo:     { title: 'Tasks',              pos: { x: 240, y: 120 }, size: { w: 660, h: 520 } },
};

type VisibleIcon = 'terminal' | 'browser' | 'files' | 'readme' | 'resume' | 'pomodoro' | 'todo';
const DEFAULT_ICON_POS: Record<VisibleIcon, { x: number; y: number }> = {
  terminal: { x: 16, y: 16  },
  browser:  { x: 16, y: 110 },
  files:    { x: 16, y: 204 },
  readme:   { x: 16, y: 298 },
  resume:   { x: 16, y: 392 },
  pomodoro: { x: 16, y: 486 },
  todo:     { x: 16, y: 580 },
};
function loadIconPos(): Record<VisibleIcon, { x: number; y: number }> {
  try { return JSON.parse(localStorage.getItem('prav_icon_pos') || 'null') || DEFAULT_ICON_POS; }
  catch { return { ...DEFAULT_ICON_POS }; }
}

// ── Window frame ──────────────────────────────────────────────────────────────
function AppWindowFrame({ app, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children }: {
  app: AppWindow;
  onClose:    () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus:    () => void;
  onMove:     (pos: { x: number; y: number }) => void;
  onResize:   (size: { w: number; h: number }) => void;
  children:   React.ReactNode;
}) {
  const dragRef   = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // ── Title bar drag ──────────────────────────────────────────────────────────
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (app.maximized) return;
    onFocus();
    dragRef.current = { startX: clientX, startY: clientY, originX: app.pos.x, originY: app.pos.y };
  }, [app.maximized, app.pos.x, app.pos.y, onFocus]);

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (app.maximized) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    const move = (me: MouseEvent) => {
      if (!dragRef.current) return;
      onMove({
        x: Math.max(0, dragRef.current.originX + me.clientX - dragRef.current.startX),
        y: Math.max(0, dragRef.current.originY + me.clientY - dragRef.current.startY),
      });
    };
    const up = () => { dragRef.current = null; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [app.maximized, startDrag, onMove]);

  const onTitleTouchStart = useCallback((e: React.TouchEvent) => {
    if (app.maximized || e.touches.length !== 1) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
    const move = (te: TouchEvent) => {
      if (!dragRef.current || te.touches.length !== 1) return;
      const touch = te.touches[0];
      onMove({
        x: Math.max(0, dragRef.current.originX + touch.clientX - dragRef.current.startX),
        y: Math.max(0, dragRef.current.originY + touch.clientY - dragRef.current.startY),
      });
    };
    const up = () => { dragRef.current = null; document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', up);
  }, [app.maximized, startDrag, onMove]);

  // ── Resize handle ───────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (app.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: app.size.w, startH: app.size.h };
    const move = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      onResize({
        w: Math.max(320, resizeRef.current.startW + me.clientX - resizeRef.current.startX),
        h: Math.max(200, resizeRef.current.startH + me.clientY - resizeRef.current.startY),
      });
    };
    const up = () => { resizeRef.current = null; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [app.maximized, app.size.w, app.size.h, onResize]);

  if (app.minimized) return null;

  const appIcon = (() => {
    if (app.type === 'terminal') return <Terminal    className="w-3 h-3" />;
    if (app.type === 'browser')  return <Chrome      className="w-3 h-3 text-blue-400" />;
    if (app.type === 'files')    return <Folder      className="w-3 h-3 text-blue-400" />;
    if (app.type === 'readme')   return <FileText    className="w-3 h-3 text-gray-400" />;
    if (app.type === 'resume')   return <FileIcon    className="w-3 h-3 text-red-400" />;
    if (app.type === 'notes')    return <StickyNote  className="w-3 h-3 text-yellow-400" />;
    if (app.type === 'pomodoro') return <Timer       className="w-3 h-3 text-red-400" />;
    if (app.type === 'todo')     return <CheckSquare className="w-3 h-3 text-blue-400" />;
    return null;
  })();

  const style = app.maximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex: app.zIndex }
    : { top: app.pos.y, left: app.pos.x, width: app.size.w, height: app.size.h, zIndex: app.zIndex };

  return (
    <div
      className={`absolute rounded-lg shadow-2xl flex flex-col overflow-hidden border border-white/10
        ${app.maximized ? 'inset-0 w-full h-full rounded-none pb-12' : ''}`}
      style={style}
      onMouseDown={onFocus}
    >
      <div
        className={`h-8 bg-[#1e1e1e] flex items-center px-4 select-none shrink-0 ${app.maximized ? '' : 'cursor-move'}`}
        onMouseDown={onTitleMouseDown}
        onTouchStart={onTitleTouchStart}
      >
        <div className="flex gap-2 mr-4">
          <button onMouseDown={e => e.stopPropagation()} onClick={onClose}    className="w-3 h-3 rounded-full bg-red-500    hover:bg-red-400    flex items-center justify-center group"><X         className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" /></button>
          <button onMouseDown={e => e.stopPropagation()} onClick={onMinimize} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center group"><Minus      className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" /></button>
          <button onMouseDown={e => e.stopPropagation()} onClick={onMaximize} className="w-3 h-3 rounded-full bg-green-500  hover:bg-green-400  flex items-center justify-center group"><Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" /></button>
        </div>
        <div className="flex-1 text-center text-xs text-gray-400 font-medium flex items-center justify-center gap-2">
          {appIcon} <span>{app.title}</span>
        </div>
      </div>

      <div className="flex-1 bg-black overflow-hidden relative">{children}</div>

      {/* Resize handle */}
      {!app.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity z-10"
          onMouseDown={onResizeMouseDown}
          style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.2) 50%)' }}
          title="Drag to resize"
        />
      )}
    </div>
  );
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="text-xs text-gray-300 tabular-nums font-mono">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
}

// ── README viewer ─────────────────────────────────────────────────────────────
const README_CONTENT = `Pravakar Rijal — Developer
=========================

Quick Start:
  - Open Terminal and type 'help'
  - Open Browser to view portfolio
  - Try: ai "tell me about Pravakar's projects"
  - Explore Files to navigate the filesystem

Contact: pravakarrijal11@gmail.com
LinkedIn: linkedin.com/in/pravakar-rijal
GitHub:   github.com/pravakar-rijal`;

function TextEditorApp({ content }: { content: string }) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <div className="border-b border-white/10 px-4 py-1.5 text-xs bg-[#252525] flex items-center gap-4 text-gray-400">
        <span className="hover:text-white cursor-pointer">File</span>
        <span className="hover:text-white cursor-pointer">Edit</span>
        <span className="hover:text-white cursor-pointer">View</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{content}</pre>
      </div>
    </div>
  );
}

// ── Draggable desktop icon ────────────────────────────────────────────────────
function DraggableIcon({
  id, label, icon, pos, onMove, onOpen,
}: {
  id: string; label: string; icon: React.ReactNode;
  pos: { x: number; y: number };
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onOpen: () => void;
}) {
  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);
  const clickTs  = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    movedRef.current = false;
    dragRef.current  = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    const move = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.sx;
      const dy = me.clientY - dragRef.current.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        movedRef.current = true;
        onMove(id, { x: Math.max(0, dragRef.current.ox + dx), y: Math.max(0, dragRef.current.oy + dy) });
      }
    };
    const up = () => { dragRef.current = null; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [id, pos.x, pos.y, onMove]);

  const onClick = useCallback(() => {
    if (movedRef.current) return;
    const now = Date.now();
    if (now - clickTs.current < 400) { onOpen(); clickTs.current = 0; }
    else clickTs.current = now;
  }, [onOpen]);

  return (
    <div
      className="absolute flex flex-col items-center gap-1 w-20 p-2 rounded hover:bg-white/10 cursor-default select-none"
      style={{ left: pos.x, top: pos.y, zIndex: 1 }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={`Double-click to open ${label}`}
    >
      {icon}
      <span className="text-[11px] text-white drop-shadow-md text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Taskbar button ────────────────────────────────────────────────────────────
function TaskbarWindowBtn({ w, isFocused, onClick }: {
  w: AppWindow; isFocused: boolean; onClick: () => void;
}) {
  const icon = (() => {
    if (w.type === 'terminal') return <Terminal    className="w-5 h-5" />;
    if (w.type === 'browser')  return <Chrome      className="w-5 h-5 text-blue-400" />;
    if (w.type === 'files')    return <Folder      className="w-5 h-5 text-blue-400" fill="currentColor" fillOpacity={0.8} />;
    if (w.type === 'readme')   return <FileText    className="w-5 h-5 text-gray-400" />;
    if (w.type === 'resume')   return <FileIcon    className="w-5 h-5 text-red-400"  fill="currentColor" fillOpacity={0.2} />;
    if (w.type === 'notes')    return <StickyNote  className="w-5 h-5 text-yellow-400" />;
    if (w.type === 'pomodoro') return <Timer       className="w-5 h-5 text-red-400" />;
    if (w.type === 'todo')     return <CheckSquare className="w-5 h-5 text-blue-400" />;
    return null;
  })();
  return (
    <button
      onClick={onClick} title={w.title}
      className={`w-10 h-10 rounded hover:bg-white/10 flex items-center justify-center transition-colors relative ${isFocused ? 'bg-white/20' : ''}`}
    >
      {icon}
      {!w.minimized && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
    </button>
  );
}

// ── Right-click context menu ──────────────────────────────────────────────────
function ContextMenu({ x, y, onClose, openApp, wallpaper, setWallpaper }: {
  x: number; y: number; onClose: () => void;
  openApp: (type: AppType) => void;
  wallpaper: Wallpaper; setWallpaper: (w: Wallpaper) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const nextWallpaper = () => {
    const idx = WALLPAPERS.indexOf(wallpaper);
    const next = WALLPAPERS[(idx + 1) % WALLPAPERS.length];
    setWallpaper(next);
    localStorage.setItem('prav_wallpaper', next);
    onClose();
  };

  const section = (label: string) => (
    <div className="px-3 py-1 text-[10px] text-gray-600 uppercase tracking-wider font-medium select-none">{label}</div>
  );
  const divider = () => <div className="my-1 h-px bg-white/10 mx-2" />;
  const item = (label: string, icon: string, action: () => void) => (
    <button
      key={label}
      onClick={() => { action(); onClose(); }}
      className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded"
    >
      <span className="text-base leading-none w-4 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 220;
  const menuH = 320;
  const left = x + menuW > vw ? x - menuW : x;
  const top  = y + menuH > vh ? y - menuH : y;

  return (
    <div
      ref={ref}
      className="context-in fixed z-[99999] bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-2 overflow-hidden"
      style={{ left, top, width: menuW, minHeight: 80 }}
    >
      {section('Open App')}
      {item('New Terminal',  '⌨️', () => openApp('terminal'))}
      {item('New Browser',   '🌐', () => openApp('browser'))}
      {item('File Manager',  '📁', () => openApp('files'))}
      {item('Pomodoro',      '🍅', () => openApp('pomodoro'))}
      {item('Tasks',         '✅', () => openApp('todo'))}
      {divider()}
      {section('Desktop')}
      <button
        onClick={nextWallpaper}
        className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded"
      >
        <span className="text-base leading-none w-4 text-center">🎨</span>
        <span className="flex-1">Change Wallpaper</span>
        <span className="text-[11px] text-gray-500">{WALLPAPER_LABEL[wallpaper]}</span>
      </button>
      {divider()}
      {item('About System',  'ℹ️', () => openApp('readme'))}
    </div>
  );
}

// ── Main Desktop ──────────────────────────────────────────────────────────────
export default function LinuxDesktop() {
  const isMobile = useIsMobile();
  const [windows,       setWindows]       = useState<AppWindow[]>([]);
  const [nextZ,         setNextZ]         = useState(10);
  const [profileData,   setProfileData]   = useState<any>(null);
  const [notesUnlocked, setNotesUnlocked] = useState(false);
  const [iconPos,       setIconPos]       = useState<Record<VisibleIcon, { x: number; y: number }>>(loadIconPos);
  const [wallpaper,     setWallpaper]     = useState<Wallpaper>(loadWallpaper);
  const [contextMenu,   setContextMenu]   = useState<{ x: number; y: number } | null>(null);

  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    setWindows([
      { id: 'browser-0',  type: 'browser',  title: APP_CONFIGS.browser.title,  zIndex: 2, minimized: false, maximized: false, pos: { ...APP_CONFIGS.browser.pos  }, size: { ...APP_CONFIGS.browser.size  } },
    ]);
  }, []);

  useEffect(() => { api.profile.getAll().then(setProfileData).catch(console.error); }, []);

  // ── App management ──────────────────────────────────────────────────────────
  const openApp = useCallback((type: AppType) => {
    setNextZ(z => z + 1);
    setWindows(prev => {
      const existing = prev.find(w => w.type === type);
      if (existing) {
        return prev.map(w => w.id === existing.id ? { ...w, minimized: false, zIndex: nextZ } : w);
      }
      const cfg = APP_CONFIGS[type];
      const offset = prev.filter(w => w.type === type).length * 24;
      return [...prev, {
        id: `${type}-${Date.now()}`, type, title: cfg.title, zIndex: nextZ,
        minimized: false, maximized: false,
        pos: { x: cfg.pos.x + offset, y: cfg.pos.y + offset },
        size: { ...cfg.size },
      }];
    });
  }, [nextZ]);

  const unlockAndOpenNotes = useCallback(() => {
    setNotesUnlocked(true);
    openApp('notes');
  }, [openApp]);

  // Wallpaper change from terminal
  const changeWallpaper = useCallback((name: string) => {
    const wp = WALLPAPERS.find(w => w === name);
    if (wp) {
      setWallpaper(wp);
      localStorage.setItem('prav_wallpaper', wp);
    }
  }, []);

  const closeApp    = (id: string) => setWindows(p => p.filter(w => w.id !== id));
  const minimizeApp = (id: string) => setWindows(p => p.map(w => w.id === id ? { ...w, minimized: true } : w));
  const maximizeApp = (id: string) => setWindows(p => p.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  const focusApp    = useCallback((id: string) => {
    setNextZ(z => z + 1);
    setWindows(p => p.map(w => w.id === id ? { ...w, zIndex: nextZ } : w));
  }, [nextZ]);
  const moveApp   = (id: string, pos: { x: number; y: number }) =>
    setWindows(p => p.map(w => w.id === id ? { ...w, pos } : w));
  const resizeApp = (id: string, size: { w: number; h: number }) =>
    setWindows(p => p.map(w => w.id === id ? { ...w, size } : w));

  const moveIcon = useCallback((id: string, pos: { x: number; y: number }) => {
    setIconPos(prev => {
      const updated = { ...prev, [id]: pos };
      localStorage.setItem('prav_icon_pos', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const renderApp = (w: AppWindow) => {
    const p = profileData;
    if (w.type === 'terminal') return (
      <TerminalApp
        profileData={p}
        openApp={t => openApp(t as AppType)}
        onUnlockNotes={unlockAndOpenNotes}
        onWallpaperChange={changeWallpaper}
      />
    );
    if (w.type === 'browser')  return <BrowserApp  profileData={p} openApp={t => openApp(t as AppType)} initialUrl="portfolio.dev" />;
    if (w.type === 'files')    return <FileManagerApp profileData={p} openApp={t => openApp(t as AppType)} />;
    if (w.type === 'readme')   return <TextEditorApp content={README_CONTENT} />;
    if (w.type === 'resume')   return <BrowserApp  profileData={p} openApp={t => openApp(t as AppType)} initialUrl="resume.pravakar.dev" />;
    if (w.type === 'notes')    return <NotesApp isUnlocked={notesUnlocked} />;
    if (w.type === 'pomodoro') return <PomodoroApp />;
    if (w.type === 'todo')     return <TodoApp />;
    return null;
  };

  const terminalWin    = windows.find(w => w.type === 'terminal');
  const topZ           = nextZ - 1;
  const terminalFocused = terminalWin && terminalWin.zIndex === topZ && !terminalWin.minimized;
  const terminalOpen    = terminalWin && !terminalWin.minimized;

  const handlePinnedTerminal = () => {
    if (!terminalWin) { openApp('terminal'); return; }
    const isFocused = terminalWin.zIndex === topZ && !terminalWin.minimized;
    if (isFocused) minimizeApp(terminalWin.id);
    else if (terminalWin.minimized) {
      setWindows(p => p.map(w => w.id === terminalWin.id ? { ...w, minimized: false } : w));
      focusApp(terminalWin.id);
    } else focusApp(terminalWin.id);
  };

  const DESKTOP_ICONS: { id: VisibleIcon; label: string; icon: React.ReactNode; onOpen: () => void }[] = [
    { id: 'terminal', label: 'Terminal',   onOpen: () => openApp('terminal'),
      icon: <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg"><Terminal className="w-6 h-6 text-gray-300" /></div> },
    { id: 'browser',  label: 'Browser',    onOpen: () => openApp('browser'),
      icon: <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"><Chrome className="w-8 h-8 text-blue-500" /></div> },
    { id: 'files',    label: 'Files',      onOpen: () => openApp('files'),
      icon: <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg"><Folder className="w-6 h-6 text-white" fill="currentColor" fillOpacity={0.8} /></div> },
    { id: 'readme',   label: 'README.md',  onOpen: () => openApp('readme'),
      icon: <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center shadow-lg"><FileText className="w-6 h-6 text-gray-700" /></div> },
    { id: 'resume',   label: 'Resume.pdf', onOpen: () => openApp('resume'),
      icon: <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center shadow-lg"><FileIcon className="w-6 h-6 text-red-600" fill="currentColor" fillOpacity={0.2} /></div> },
    { id: 'pomodoro', label: 'Pomodoro',   onOpen: () => openApp('pomodoro'),
      icon: <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center shadow-lg"><Timer className="w-6 h-6 text-red-400" /></div> },
    { id: 'todo',     label: 'Tasks',      onOpen: () => openApp('todo'),
      icon: <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg"><CheckSquare className="w-6 h-6 text-blue-400" /></div> },
  ];

  if (isMobile) return <MobileView />;

  return (
    <div
      className={`${WALLPAPER_CLASS[wallpaper]} w-full h-[100dvh] flex flex-col relative overflow-hidden text-white select-none font-sans`}
      onContextMenu={handleDesktopContextMenu}
    >
      {/* ── Desktop area ── */}
      <div className="flex-1 relative z-0">
        {DESKTOP_ICONS.map(ic => (
          <DraggableIcon
            key={ic.id} id={ic.id} label={ic.label} icon={ic.icon}
            pos={iconPos[ic.id]} onMove={moveIcon} onOpen={ic.onOpen}
          />
        ))}

        {windows.map(w => (
          <AppWindowFrame
            key={w.id} app={w}
            onClose={    () => closeApp(w.id)}
            onMinimize={ () => minimizeApp(w.id)}
            onMaximize={ () => maximizeApp(w.id)}
            onFocus={    () => focusApp(w.id)}
            onMove={pos  => moveApp(w.id, pos)}
            onResize={sz => resizeApp(w.id, sz)}
          >
            {renderApp(w)}
          </AppWindowFrame>
        ))}
      </div>

      {/* Corner watermark */}
      <div className="absolute bottom-14 right-4 text-[10px] pointer-events-none font-mono" style={{ color: 'rgba(0,255,65,0.3)' }}>
        pravakar@prav-pc:~$
      </div>

      {/* ── Taskbar ── */}
      <div className="h-12 bg-[#0f0f0f]/95 backdrop-blur-sm border-t border-white/10 flex items-center px-3 justify-between relative z-[9999] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePinnedTerminal} title="Terminal"
            className={`w-10 h-10 rounded flex items-center justify-center transition-colors relative ${terminalFocused ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <Terminal className="w-5 h-5 text-gray-300" />
            {terminalOpen && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          {windows.filter(w => w.type !== 'terminal').map(w => (
            <TaskbarWindowBtn
              key={w.id} w={w}
              isFocused={w.zIndex === topZ && !w.minimized}
              onClick={() => {
                const isFocused = w.zIndex === topZ && !w.minimized;
                if (isFocused) minimizeApp(w.id);
                else if (w.minimized) {
                  setWindows(p => p.map(win => win.id === w.id ? { ...win, minimized: false } : win));
                  focusApp(w.id);
                } else focusApp(w.id);
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <WeatherWidget />
          <div className="w-px h-4 bg-white/10" />
          <Clock />
          <div className="w-px h-4 bg-white/10" />
          <div
            className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors"
            title={`Wallpaper: ${WALLPAPER_LABEL[wallpaper]} — right-click desktop to change`}
            onClick={() => {
              const idx = WALLPAPERS.indexOf(wallpaper);
              const next = WALLPAPERS[(idx + 1) % WALLPAPERS.length];
              setWallpaper(next);
              localStorage.setItem('prav_wallpaper', next);
            }}
          >
            {WALLPAPER_LABEL[wallpaper]}
          </div>
        </div>
      </div>

      {/* ── Right-click context menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          openApp={openApp}
          wallpaper={wallpaper}
          setWallpaper={wp => { setWallpaper(wp); localStorage.setItem('prav_wallpaper', wp); }}
        />
      )}
    </div>
  );
}
