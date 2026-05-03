import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Coffee, Brain } from 'lucide-react';

type Mode = 'work' | 'short' | 'long';

const DEFAULTS = { work: 25, short: 5, long: 15 };
const LABELS: Record<Mode, string>  = { work: 'Focus',       short: 'Short Break', long: 'Long Break' };
const COLORS: Record<Mode, string>  = { work: '#ef4444',     short: '#22c55e',     long: '#3b82f6' };
const BG:     Record<Mode, string>  = { work: '#1a0a0a',     short: '#0a1a0a',     long: '#0a0a1a' };

function playBeep(ctx: AudioContext) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function Pomodoro() {
  const [mode, setMode]           = useState<Mode>('work');
  const [durations, setDurations] = useState({ ...DEFAULTS });
  const [secsLeft, setSecsLeft]   = useState(DEFAULTS.work * 60);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tmpDur, setTmpDur]       = useState({ ...DEFAULTS });

  const audioCtx = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs = durations[mode] * 60;
  const progress  = 1 - secsLeft / totalSecs;
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSecsLeft(durations[m] * 60);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [durations]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          if (!audioCtx.current) audioCtx.current = new AudioContext();
          try { playBeep(audioCtx.current); } catch {}
          if (mode === 'work') {
            setSessions(s => s + 1);
            setMode(sessions % 4 === 3 ? 'long' : 'short');
            setTimeout(() => setSecsLeft(durations[sessions % 4 === 3 ? 'long' : 'short'] * 60), 0);
          } else {
            setMode('work');
            setTimeout(() => setSecsLeft(durations.work * 60), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, mode, durations, sessions]);

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecsLeft(durations[mode] * 60);
  };

  const applySettings = () => {
    setDurations({ ...tmpDur });
    setSecsLeft(tmpDur[mode] * 60);
    setShowSettings(false);
    setRunning(false);
  };

  // SVG circle ring
  const R    = 90;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * (1 - progress);
  const color = COLORS[mode];

  return (
    <div
      className="h-full flex flex-col items-center justify-between text-white font-sans transition-colors duration-700"
      style={{ background: `radial-gradient(ellipse at center, ${BG[mode]} 0%, #0a0a0a 100%)` }}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 pt-5">
        <div className="flex gap-2">
          {(['work', 'short', 'long'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={mode === m
                ? { background: color, color: '#000' }
                : { background: 'rgba(255,255,255,0.08)', color: '#aaa' }}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>
        <button onClick={() => { setTmpDur({ ...durations }); setShowSettings(s => !s); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Main ring */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="110" cy="110" r={R}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dash}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none', filter: `drop-shadow(0 0 8px ${color}80)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>
              {pad(mins)}:{pad(secs)}
            </span>
            <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{LABELS[mode]}</span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: i < (sessions % 4) || (sessions % 4 === 0 && sessions > 0 && i === 0 && mode !== 'work') ? color : 'rgba(255,255,255,0.15)' }}
            />
          ))}
          <span className="text-xs text-gray-500 ml-2">{sessions} session{sessions !== 1 ? 's' : ''}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={reset} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <RotateCcw className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg"
            style={{ background: color, boxShadow: `0 0 24px ${color}60` }}
          >
            {running
              ? <Pause className="w-7 h-7 text-black" fill="black" />
              : <Play  className="w-7 h-7 text-black" fill="black" style={{ marginLeft: 2 }} />}
          </button>
          <div className="w-11 h-11" />
        </div>
      </div>

      {/* Footer tip */}
      <div className="pb-5 text-xs text-gray-600 flex items-center gap-1.5">
        {mode === 'work'
          ? <><Brain className="w-3.5 h-3.5" /> Stay focused — no distractions</>
          : <><Coffee className="w-3.5 h-3.5" /> Rest your eyes, stretch a bit</>}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a1c] border border-white/10 rounded-xl p-6 w-72 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Timer Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            {(['work', 'short', 'long'] as Mode[]).map(m => (
              <div key={m} className="flex items-center justify-between">
                <label className="text-sm text-gray-300">{LABELS[m]}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1} max={120}
                    value={tmpDur[m]}
                    onChange={e => setTmpDur(prev => ({ ...prev, [m]: Number(e.target.value) }))}
                    className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-center outline-none focus:border-white/30"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
            ))}
            <button onClick={applySettings} className="w-full py-2 rounded-lg font-medium text-sm transition-colors" style={{ background: color, color: '#000' }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
