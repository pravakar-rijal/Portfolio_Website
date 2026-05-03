import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Save, Lock, FileText, StickyNote } from 'lucide-react';

const STORAGE_KEY = 'prav_notes_data';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

function loadNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function Notes({ isUnlocked }: { isUnlocked: boolean }) {
  const [notes,       setNotes]       = useState<Note[]>(loadNotes);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [editTitle,   setEditTitle]   = useState('');
  const [editContent, setEditContent] = useState('');
  const [dirty,       setDirty]       = useState(false);

  // ── Locked screen ──────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="h-full bg-[#111113] flex flex-col items-center justify-center gap-5 text-white font-sans select-none">
        <div className="w-16 h-16 rounded-full bg-[#1e1e20] border border-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-yellow-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold">Notes is locked</h2>
          <p className="text-sm text-gray-500">Open your terminal and type</p>
          <code className="block mt-2 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-green-400 font-mono text-sm">
            notes
          </code>
          <p className="text-xs text-gray-600 mt-1">then enter your PIN to unlock</p>
        </div>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const saveNote = useCallback(() => {
    if (!selected) return;
    setNotes(prev => {
      const updated = prev.map(n => n.id === selected
        ? { ...n, title: editTitle || 'Untitled', content: editContent, updatedAt: new Date().toISOString() }
        : n
      );
      saveNotes(updated);
      return updated;
    });
    setDirty(false);
  }, [selected, editTitle, editContent]);

  const newNote = () => {
    const note: Note = { id: Date.now().toString(), title: 'New Note', content: '', updatedAt: new Date().toISOString() };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    selectNote(note);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (selected === id) { setSelected(null); setEditTitle(''); setEditContent(''); }
  };

  const selectNote = (n: Note) => {
    if (dirty) saveNote();
    setSelected(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
    setDirty(false);
  };

  // ── Unlocked ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex bg-[#111113] text-white font-sans text-sm">

      {/* Sidebar */}
      <div className="w-60 bg-[#18181a] border-r border-white/5 flex flex-col shrink-0">
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-sm">Notes</span>
          </div>
          <button onClick={newNote} title="New note" className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notes.length === 0 && (
            <div className="flex flex-col items-center gap-3 mt-12 px-4 text-center">
              <FileText className="w-10 h-10 text-gray-700" />
              <p className="text-gray-600 text-xs">No notes yet. Click + to create one.</p>
            </div>
          )}
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => selectNote(n)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors
                ${selected === n.id ? 'bg-white/10 border-l-2 border-l-yellow-400' : ''}`}
            >
              <div className="font-medium truncate text-sm">{n.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{n.content.slice(0, 40) || 'Empty'}</div>
              <div className="text-[10px] text-gray-600 mt-1">{new Date(n.updatedAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          <div className="h-12 border-b border-white/5 flex items-center gap-3 px-4">
            <input
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); setDirty(true); }}
              className="flex-1 bg-transparent font-semibold text-base outline-none placeholder:text-gray-600"
              placeholder="Note title…"
            />
            <button onClick={saveNote} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-medium transition-colors">
              <Save className="w-3.5 h-3.5" /> {dirty ? 'Save*' : 'Saved'}
            </button>
            <button onClick={() => deleteNote(selected!)} className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={editContent}
            onChange={e => { setEditContent(e.target.value); setDirty(true); }}
            onBlur={saveNote}
            className="flex-1 bg-transparent p-6 resize-none outline-none text-gray-300 leading-relaxed custom-scrollbar font-mono text-sm"
            placeholder="Start typing your note here…"
          />
          <div className="h-6 border-t border-white/5 flex items-center px-4 text-[10px] text-gray-600 shrink-0">
            {editContent.length} chars · {editContent.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-600">
          <FileText className="w-12 h-12 text-gray-800" />
          <p className="text-sm">Select a note or create a new one</p>
        </div>
      )}
    </div>
  );
}
