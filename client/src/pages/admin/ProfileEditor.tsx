import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function ProfileEditor() {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.profile.getAll().then(setProfile).catch(console.error);
  }, []);

  const handleSave = async (section: string, data: any) => {
    setSaving(true);
    try {
      await api.profile.updateSection(section, data);
      setProfile((prev: any) => ({ ...prev, [section]: data }));
      alert('Saved successfully');
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="p-8 text-gray-400">Loading profile...</div>;

  const tabs = ['about', 'skills', 'experience', 'projects', 'education', 'certifications'];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">Profile Editor</h2>
      
      <div className="flex gap-2 border-b border-gray-800 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-sm min-h-[500px]">
        {activeTab === 'about' && (
          <AboutTab data={profile.about || {}} onSave={(data: any) => handleSave('about', data)} saving={saving} />
        )}
        {activeTab === 'skills' && (
          <SkillsTab data={profile.skills?.technical || profile.skills || []} onSave={(data: any) => handleSave('skills', { technical: data, soft: profile.skills?.soft || [] })} saving={saving} />
        )}
        {activeTab === 'experience' && (
          <ExperienceTab data={profile.experience || []} onSave={(data: any) => handleSave('experience', data)} saving={saving} />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab data={profile.projects || []} onSave={(data: any) => handleSave('projects', data)} saving={saving} />
        )}
        {activeTab === 'education' && (
          <EducationTab data={profile.education || []} onSave={(data: any) => handleSave('education', data)} saving={saving} />
        )}
        {activeTab === 'certifications' && (
          <CertificationsTab data={profile.certifications || []} onSave={(data: any) => handleSave('certifications', data)} saving={saving} />
        )}
      </div>
    </div>
  );
}

function AboutTab({ data, onSave, saving }: any) {
  const [form, setForm] = useState(data);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
          <input type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
          <input type="text" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
          <input type="text" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">LinkedIn URL</label>
          <input type="url" value={form.linkedin || ''} onChange={e => setForm({...form, linkedin: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">GitHub URL</label>
          <input type="url" value={form.github || ''} onChange={e => setForm({...form, github: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
        <textarea value={form.bio || ''} onChange={e => setForm({...form, bio: e.target.value})} rows={4} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white resize-none" />
      </div>
      <button onClick={() => onSave(form)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save About Section'}
      </button>
    </div>
  );
}

function SkillsTab({ data, onSave, saving }: any) {
  const [skills, setSkills] = useState<any[]>(Array.isArray(data) ? data : []);
  const update = (i: number, key: string, val: any) => { const n = [...skills]; n[i] = { ...n[i], [key]: val }; setSkills(n); };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-xs text-gray-500 font-medium px-1">
        <span>Skill Name</span><span>Category</span><span className="text-center">Level (1–5)</span><span></span>
      </div>
      {skills.map((skill, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
          <input type="text" value={skill.name || ''} onChange={e => update(i, 'name', e.target.value)} placeholder="e.g. C#" className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
          <input type="text" value={skill.category || ''} onChange={e => update(i, 'category', e.target.value)} placeholder="Language" className="w-32 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
          <input type="number" min="1" max="5" value={skill.level || 3} onChange={e => update(i, 'level', Number(e.target.value))} className="w-20 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm text-center focus:border-blue-500 outline-none" />
          <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
        </div>
      ))}
      <button onClick={() => setSkills([...skills, { name: '', level: 3, category: 'Language' }])} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors">+ Add Skill</button>
      <div className="pt-4 border-t border-gray-800">
        <button onClick={() => onSave(skills)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </div>
  );
}

function EducationTab({ data, onSave, saving }: any) {
  const [items, setItems] = useState<any[]>(Array.isArray(data) ? data : []);
  const update = (i: number, key: string, val: any) => { const n = [...items]; n[i] = { ...n[i], [key]: val }; setItems(n); };
  return (
    <div className="space-y-6">
      {items.map((ed, i) => (
        <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded relative space-y-3">
          <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 text-sm">✕</button>
          <div className="grid grid-cols-2 gap-4 pr-8">
            <div><label className="block text-xs text-gray-500 mb-1">Institution</label>
              <input type="text" value={ed.institution || ''} onChange={e => update(i, 'institution', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Degree</label>
              <input type="text" value={ed.degree || ''} onChange={e => update(i, 'degree', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Period</label>
              <input type="text" value={ed.period || ''} onChange={e => update(i, 'period', e.target.value)} placeholder="2021 – 2025" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Location</label>
              <input type="text" value={ed.location || ''} onChange={e => update(i, 'location', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Achievements (one per line)</label>
            <textarea value={Array.isArray(ed.achievements) ? ed.achievements.join('\n') : (ed.achievements || '')} onChange={e => update(i, 'achievements', e.target.value.split('\n').filter(Boolean))} rows={3} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm resize-none focus:border-blue-500 outline-none" /></div>
        </div>
      ))}
      <button onClick={() => setItems([...items, { institution: '', degree: '', period: '', location: '', achievements: [] }])} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors">+ Add Education</button>
      <div className="pt-4 border-t border-gray-800">
        <button onClick={() => onSave(items)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Education'}</button>
      </div>
    </div>
  );
}

function CertificationsTab({ data, onSave, saving }: any) {
  const [items, setItems] = useState<any[]>(Array.isArray(data) ? data : []);
  const update = (i: number, key: string, val: any) => { const n = [...items]; n[i] = { ...n[i], [key]: val }; setItems(n); };
  return (
    <div className="space-y-4">
      {items.map((cert, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">
          <input type="text" value={cert.name || ''} onChange={e => update(i, 'name', e.target.value)} placeholder="Certification name" className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
          <input type="text" value={cert.issuer || ''} onChange={e => update(i, 'issuer', e.target.value)} placeholder="Issuer" className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
          <input type="text" value={cert.date || ''} onChange={e => update(i, 'date', e.target.value)} placeholder="Sept 2024" className="w-28 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
          <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
        </div>
      ))}
      <button onClick={() => setItems([...items, { name: '', issuer: '', date: '' }])} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors">+ Add Certification</button>
      <div className="pt-4 border-t border-gray-800">
        <button onClick={() => onSave(items)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Certifications'}</button>
      </div>
    </div>
  );
}

function ExperienceTab({ data, onSave, saving }: any) {
  const [experiences, setExperiences] = useState<any[]>(Array.isArray(data) ? data : []);
  return (
    <div className="space-y-6">
      {experiences.map((exp, i) => (
        <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded relative space-y-3">
          <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 text-sm">Remove</button>
          <div className="grid grid-cols-2 gap-4 pr-12">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <input type="text" value={exp.company || ''} onChange={e => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <input type="text" value={exp.role || ''} onChange={e => { const n = [...experiences]; n[i].role = e.target.value; setExperiences(n); }} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period</label>
              <input type="text" value={exp.period || ''} onChange={e => { const n = [...experiences]; n[i].period = e.target.value; setExperiences(n); }} placeholder="e.g. Jan 2020 - Present" className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={exp.description || ''} onChange={e => { const n = [...experiences]; n[i].description = e.target.value; setExperiences(n); }} rows={2} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm resize-none" />
          </div>
        </div>
      ))}
      <button onClick={() => setExperiences([...experiences, { company: '', role: '', period: '', description: '' }])} className="px-4 py-2 bg-gray-800 text-white rounded text-sm">Add Experience</button>
      <div className="pt-4 border-t border-gray-800">
        <button onClick={() => onSave(experiences)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </div>
  );
}

function ProjectsTab({ data, onSave, saving }: any) {
  const [projects, setProjects] = useState<any[]>(Array.isArray(data) ? data : []);
  return (
    <div className="space-y-6">
      {projects.map((proj, i) => (
        <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded relative space-y-3">
          <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 text-sm">Remove</button>
          <div className="grid grid-cols-2 gap-4 pr-12">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input type="text" value={proj.name || ''} onChange={e => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tech (comma separated)</label>
              <input type="text" value={Array.isArray(proj.tech) ? proj.tech.join(', ') : (proj.tech || '')} onChange={e => { const n = [...projects]; n[i].tech = e.target.value.split(',').map(s=>s.trim()); setProjects(n); }} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={proj.description || ''} onChange={e => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} rows={2} className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1 text-white text-sm resize-none" />
          </div>
        </div>
      ))}
      <button onClick={() => setProjects([...projects, { name: '', description: '', tech: [] }])} className="px-4 py-2 bg-gray-800 text-white rounded text-sm">Add Project</button>
      <div className="pt-4 border-t border-gray-800">
        <button onClick={() => onSave(projects)} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Projects'}
        </button>
      </div>
    </div>
  );
}
