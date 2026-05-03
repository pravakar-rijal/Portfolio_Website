import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Tag, Circle, CheckCircle2, Flame, Clock, Calendar, Star } from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';
type Filter   = 'all' | 'today' | 'done' | 'starred';

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  starred: boolean;
  category: string;
  createdAt: string;
  dueToday: boolean;
}

const STORAGE_KEY = 'prav_todos';

const PRIORITY_COLORS: Record<Priority, string> = {
  high:   'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low:    'text-blue-400 bg-blue-500/10 border-blue-500/30',
};
const PRIORITY_ICONS: Record<Priority, React.ReactNode> = {
  high:   <Flame  className="w-3 h-3" />,
  medium: <Clock  className="w-3 h-3" />,
  low:    <Circle className="w-3 h-3" />,
};

const CATEGORIES = ['Work', 'Learning', 'Personal', 'Health', 'Misc'];

function load(): Task[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(t: Task[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

export default function TodoApp() {
  const [tasks,    setTasks]    = useState<Task[]>(load);
  const [input,    setInput]    = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Work');
  const [dueToday, setDueToday] = useState(false);
  const [filter,   setFilter]   = useState<Filter>('all');
  const [showAdd,  setShowAdd]  = useState(false);

  useEffect(() => { save(tasks); }, [tasks]);

  const addTask = () => {
    if (!input.trim()) return;
    const t: Task = {
      id: Date.now().toString(),
      text: input.trim(),
      done: false,
      priority,
      starred: false,
      category,
      dueToday,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [t, ...prev]);
    setInput('');
    setShowAdd(false);
  };

  const toggle  = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const star    = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  const remove  = (id: string) => setTasks(p => p.filter(t => t.id !== id));
  const clearDone = () => setTasks(p => p.filter(t => !t.done));

  const filtered = tasks.filter(t => {
    if (filter === 'today')   return t.dueToday && !t.done;
    if (filter === 'done')    return t.done;
    if (filter === 'starred') return t.starred && !t.done;
    return !t.done;
  });

  const counts = {
    all:     tasks.filter(t => !t.done).length,
    today:   tasks.filter(t => t.dueToday && !t.done).length,
    starred: tasks.filter(t => t.starred && !t.done).length,
    done:    tasks.filter(t => t.done).length,
  };

  const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
    { key: 'all',     label: 'All',      icon: <Circle        className="w-3.5 h-3.5" /> },
    { key: 'today',   label: 'Today',    icon: <Calendar      className="w-3.5 h-3.5" /> },
    { key: 'starred', label: 'Starred',  icon: <Star          className="w-3.5 h-3.5" /> },
    { key: 'done',    label: 'Done',     icon: <CheckCircle2  className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-[#111113] text-white font-sans text-sm">

      {/* Header */}
      <div className="h-12 bg-[#18181a] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <span className="font-semibold">Tasks</span>
        <div className="flex gap-2 items-center">
          {counts.done > 0 && (
            <button onClick={clearDone} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear done</button>
          )}
          <button
            onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#1a1a1c] border-b border-white/5 p-4 space-y-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowAdd(false); }}
            placeholder="What needs to be done?"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/25 text-sm placeholder:text-gray-600"
            autoFocus
          />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Priority */}
            <div className="flex gap-1">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-xs capitalize transition-all
                    ${priority === p ? PRIORITY_COLORS[p] : 'text-gray-500 border-white/5 hover:border-white/15'}`}
                >
                  {PRIORITY_ICONS[p]} {p}
                </button>
              ))}
            </div>
            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs outline-none"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {/* Due today */}
            <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={dueToday} onChange={e => setDueToday(e.target.checked)} className="accent-blue-500" />
              Due today
            </label>
            <button onClick={addTask} className="ml-auto px-3 py-1 bg-white text-black rounded font-medium text-xs hover:bg-gray-200 transition-colors">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2
              ${filter === f.key ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            {f.icon}
            {f.label}
            {counts[f.key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px]
                ${filter === f.key ? 'bg-white text-black' : 'bg-white/10 text-gray-400'}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 mt-16 text-gray-600">
            <CheckCircle2 className="w-10 h-10 text-gray-800" />
            <p className="text-xs">
              {filter === 'done' ? 'No completed tasks yet' : 'No tasks here. Add one above!'}
            </p>
          </div>
        )}

        {/* Group by category when showing all */}
        {filter === 'all' || filter === 'today' || filter === 'starred' ? (
          <div className="p-3 space-y-1">
            {filtered.map(task => <TaskRow key={task.id} task={task} onToggle={toggle} onStar={star} onDelete={remove} />)}
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {filtered.map(task => <TaskRow key={task.id} task={task} onToggle={toggle} onStar={star} onDelete={remove} />)}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="h-7 border-t border-white/5 flex items-center px-4 text-[10px] text-gray-600 shrink-0 gap-3">
        <span>{counts.all} active</span>
        <span>·</span>
        <span>{counts.done} done</span>
        {counts.today > 0 && <><span>·</span><span className="text-blue-400">{counts.today} due today</span></>}
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onStar, onDelete }: {
  task: Task;
  onToggle: (id: string) => void;
  onStar:   (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group hover:bg-white/5 transition-colors
      ${task.done ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(task.id)} className="shrink-0">
        {task.done
          ? <CheckCircle2 className="w-5 h-5 text-green-400" />
          : <Circle       className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${task.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>{task.text}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_ICONS[task.priority]} {task.priority}
          </span>
          <span className="text-[10px] text-gray-600 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" /> {task.category}
          </span>
          {task.dueToday && !task.done && (
            <span className="text-[10px] text-blue-400 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> Today
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onStar(task.id)} className={`p-1 rounded hover:bg-white/10 ${task.starred ? 'text-yellow-400' : 'text-gray-600'}`}>
          <Star className="w-3.5 h-3.5" fill={task.starred ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
