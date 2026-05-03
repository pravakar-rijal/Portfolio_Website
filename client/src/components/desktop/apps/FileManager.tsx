import React, { useState, useMemo } from 'react';
import { Folder, FileText, File as FileIcon, ArrowLeft, ArrowRight, Home, Briefcase, Award, GraduationCap, User, Code } from 'lucide-react';

// ── Static home-directory structure matching the mockup exactly ──
const HOME_ITEMS = [
  { name: 'projects',       type: 'dir' as const },
  { name: 'experience',     type: 'dir' as const },
  { name: 'certifications', type: 'dir' as const },
  { name: 'about.txt',      type: 'file' as const },
  { name: 'skills.txt',     type: 'file' as const },
  { name: 'resume.pdf',     type: 'pdf' as const },
];

// ── Build dynamic children from profile data ──
function buildChildren(profile: any, folder: string): Array<{ name: string; type: 'file' | 'dir' | 'pdf'; content?: string }> {
  if (folder === 'projects') {
    return (profile?.projects || []).map((p: any) => ({
      name: `${p.name}.md`,
      type: 'file' as const,
      content: `# ${p.name}\n\n${p.description || ''}\n\nTech: ${(p.tech || []).join(', ')}\n\nHighlights:\n${(p.highlights || []).map((h: string) => `- ${h}`).join('\n')}`,
    }));
  }
  if (folder === 'experience') {
    return (profile?.experience || []).map((e: any) => ({
      name: `${e.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`,
      type: 'file' as const,
      content: `${e.role} at ${e.company}\n${e.period}\n\n${e.description || ''}\n\nTech: ${(e.tech || []).join(', ')}`,
    }));
  }
  if (folder === 'certifications') {
    return (profile?.certifications || []).map((c: any) => ({
      name: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 28)}.txt`,
      type: 'file' as const,
      content: `${c.name}\nIssued by: ${c.issuer}\nDate: ${c.date}`,
    }));
  }
  return [];
}

function buildHomeFileContent(name: string, profile: any): string {
  const a = profile?.about || {};
  if (name === 'about.txt') {
    return `Name:     ${a.name || 'Pravakar Rijal'}\nTitle:    ${a.title || '.NET Developer'}\nLocation: ${a.location || 'Kathmandu, Nepal'}\n\n${a.bio || ''}`;
  }
  if (name === 'skills.txt') {
    return (profile?.skills?.technical || [])
      .map((s: any) => `${s.name}: ${'█'.repeat(s.level || 3)}${'░'.repeat(5 - (s.level || 3))} (${s.level || 3}/5)`)
      .join('\n') || 'C#: █████ (5/5)\n.NET Core: ████░ (4/5)\nSQL: ████░ (4/5)';
  }
  return '';
}

type View = 'home' | 'folder';

export default function FileManager({
  profileData,
  openApp,
}: {
  profileData: any;
  openApp: (app: string) => void;
}) {
  const [view, setView]         = useState<View>('home');
  const [folder, setFolder]     = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);

  const folderItems = useMemo(
    () => (folder ? buildChildren(profileData, folder) : []),
    [profileData, folder]
  );

  const openFolder = (name: string) => {
    setFolder(name);
    setView('folder');
    setSelected(null);
    setPreview(null);
  };

  const goHome = () => {
    setView('home');
    setFolder('');
    setSelected(null);
    setPreview(null);
  };

  const selectFile = (name: string, content?: string) => {
    if (selected === name) {
      setSelected(null);
      setPreview(null);
    } else {
      setSelected(name);
      setPreview(content ?? null);
    }
  };

  const items = view === 'home' ? HOME_ITEMS : folderItems;

  const sidebarPlaces = [
    { name: 'Home',           icon: <Folder className="w-4 h-4 text-blue-400" />, active: view === 'home', onClick: goHome },
    { name: 'Projects',       icon: <Folder className="w-4 h-4 text-blue-400" />, active: folder === 'projects',       onClick: () => openFolder('projects') },
    { name: 'Experience',     icon: <Folder className="w-4 h-4 text-blue-400" />, active: folder === 'experience',     onClick: () => openFolder('experience') },
    { name: 'Certifications', icon: <Folder className="w-4 h-4 text-blue-400" />, active: folder === 'certifications', onClick: () => openFolder('certifications') },
  ];

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white font-sans text-sm">

      {/* ── Left sidebar ── */}
      <div className="w-48 bg-[#181818] border-r border-white/5 flex flex-col py-2 shrink-0">
        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Places</div>
        {sidebarPlaces.map(p => (
          <button
            key={p.name}
            onClick={p.onClick}
            className={`flex items-center gap-2 px-4 py-2 text-left transition-colors
              ${p.active ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
          >
            {p.icon}
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-3 bg-[#252525] shrink-0">
          <div className="flex gap-1 text-gray-400">
            <button
              onClick={goHome}
              disabled={view === 'home'}
              className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 opacity-30 cursor-not-allowed">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1 text-sm">
            <button onClick={goHome} className="text-gray-400 hover:text-white transition-colors">pravakar</button>
            {view === 'folder' && folder && (
              <>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-white">{folder}</span>
              </>
            )}
            {view === 'home' && (
              <>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-white">Home</span>
              </>
            )}
          </div>
        </div>

        {/* Icon grid + optional preview */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 content-start">
              {items.map((item) => {
                const isSelected = selected === item.name;
                const isDir  = item.type === 'dir';
                const isPdf  = item.type === 'pdf';
                const isMd   = item.name.endsWith('.md');

                return (
                  <div
                    key={item.name}
                    className={`flex flex-col items-center gap-2 cursor-pointer group p-2 rounded transition-colors
                      ${isSelected ? 'bg-white/15' : 'hover:bg-white/5'}`}
                    onClick={() => {
                      if (isDir) return;
                      if (isPdf) { openApp('resume'); return; }
                      const content = view === 'home'
                        ? buildHomeFileContent(item.name, profileData)
                        : (item as any).content ?? '';
                      selectFile(item.name, content);
                    }}
                    onDoubleClick={() => {
                      if (isDir) openFolder(item.name);
                    }}
                  >
                    {isDir && (
                      <Folder
                        className="w-12 h-12 text-blue-400 group-hover:scale-105 transition-transform"
                        fill="currentColor"
                        fillOpacity={0.2}
                      />
                    )}
                    {isPdf && (
                      <FileIcon
                        className="w-12 h-12 text-red-400 group-hover:scale-105 transition-transform"
                        fill="currentColor"
                        fillOpacity={0.2}
                      />
                    )}
                    {!isDir && !isPdf && (
                      <FileText
                        className={`w-12 h-12 group-hover:scale-105 transition-transform
                          ${isMd ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    )}
                    <span className={`text-xs text-center leading-tight break-all
                      ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {item.name}
                    </span>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="col-span-full text-center text-gray-600 text-xs mt-8">
                  Empty folder
                </div>
              )}
            </div>
          </div>

          {/* Preview panel — shown when a file is selected */}
          {preview !== null && selected && (
            <div className="w-64 border-l border-white/5 bg-[#181818] flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-white/5 bg-[#202020]">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Preview</div>
                <div className="text-sm text-white font-medium truncate">{selected}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <pre
                  className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-words"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {preview || '(empty)'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="h-6 bg-[#141414] border-t border-white/5 flex items-center px-4 text-[10px] text-gray-600 shrink-0">
          {items.length} item{items.length !== 1 ? 's' : ''}
          {selected && <span className="ml-3">— {selected}</span>}
        </div>
      </div>
    </div>
  );
}
