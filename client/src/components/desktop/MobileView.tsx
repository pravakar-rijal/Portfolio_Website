import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Phone, MapPin, Github, Linkedin,
  Code2, Briefcase, GraduationCap, FolderGit2, Award,
  Terminal, Globe, FileText, ChevronRight, ExternalLink, Rss,
} from 'lucide-react';
import { api } from '../../api/client';

const FALLBACK = {
  name:    'Pravakar Rijal',
  title:   '.NET Developer & Backend Specialist',
  bio:     'Building reliable, scalable systems from Kathmandu, Nepal. Passionate about clean architecture, enterprise software, and backend development.',
  email:   'pravakarrijal11@gmail.com',
  phone:   '+977-9815185130',
  location:'Kathmandu, Nepal',
  linkedin:'linkedin.com/in/pravakar-rijal',
  github:  'github.com/pravakar-rijal',
  skills: [
    { name: 'C#',                  level: 5 },
    { name: '.NET Core',           level: 5 },
    { name: 'ASP.NET Core MVC',    level: 4 },
    { name: 'EF Core',             level: 4 },
    { name: 'SQL Server',          level: 4 },
    { name: 'REST API Design',     level: 5 },
    { name: 'React',               level: 4 },
    { name: 'Angular',             level: 4 },
    { name: 'TypeScript',          level: 4 },
    { name: 'JWT Auth',            level: 4 },
    { name: 'Git',                 level: 4 },
    { name: 'Tailwind CSS',        level: 3 },
  ],
  skillGroups: [
    { label: 'Backend',    items: ['C# / .NET Core', 'EF Core', 'REST APIs', 'SQL Server', 'Multi-tenant Arch'] },
    { label: 'Frontend',   items: ['React', 'Angular', 'TypeScript', 'Tailwind CSS'] },
    { label: 'Tools',      items: ['Git', 'Postman', 'Visual Studio', 'Jira / Scrum'] },
    { label: 'Languages',  items: ['C#', 'Java', 'JavaScript', 'TypeScript', 'SQL'] },
  ],
  projects: [
    { name: 'vStellar',  description: 'VS Code-like IDE built with ElectronJS + Angular with a built-in Java test runner for running code directly in the browser.', tech: ['ElectronJS', 'Angular', 'Java', 'TypeScript'] },
    { name: 'yAIntra',   description: 'Enterprise HRMS featuring Role-Based Access Control, REST APIs, and JWT/Session authentication research.', tech: ['.NET Core', 'SQL Server', 'REST API', 'JWT'] },
    { name: 'NumAIrik',  description: 'Multi-tenant accounting software with full 2FA: Email OTP, SMS OTP, and Authenticator App support.', tech: ['ASP.NET Core', 'EF Core', 'SQL Server', '2FA'] },
  ],
  experience: [
    { role: 'Backend .NET Trainee', company: 'Vertex Special Technology', period: 'Feb 2025 – Present', description: 'Building enterprise software, conducting PoCs, collaborating across teams in Nepal, Pakistan, and the US using Scrum.' },
  ],
  education: [
    { degree: 'BSc Computer Science & Information Technology', school: 'Bhaktapur Multiple Campus, Tribhuvan University', period: '2021 – 2025', note: 'Academic Excellence Scholarship 2024' },
  ],
  certifications: [
    { name: 'Microsoft Certified: Foundational C#', org: 'Microsoft', date: 'Sept 2024', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/30' },
    { name: 'CS50: Introduction to Computer Science', org: 'Harvard University', date: 'Jun 2023', color: 'text-red-400', bg: 'bg-red-950/30 border-red-900/30' },
  ],
};

const NAV_ITEMS = ['About', 'Skills', 'Projects', 'Experience', 'Education', 'Blog', 'Contact'];

export default function MobileView() {
  const [profileData, setProfileData] = useState<any>(null);
  const [posts,       setPosts]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeNav,   setActiveNav]   = useState('About');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.profile.getAll().catch(() => null),
      api.blog.getPosts().catch(() => []),
    ]).then(([profile, blogPosts]) => {
      if (profile) setProfileData(profile);
      setPosts(blogPosts || []);
      setLoading(false);
    });
  }, []);

  const a          = profileData?.about          || {};
  const apiSkills  = profileData?.skills?.technical || [];
  const experience = profileData?.experience     || FALLBACK.experience;
  const projects   = profileData?.projects       || FALLBACK.projects;
  const education  = profileData?.education      || [];
  const certs      = profileData?.certifications || [];

  const name     = a.name     || FALLBACK.name;
  const title    = a.title    || FALLBACK.title;
  const bio      = a.bio      || FALLBACK.bio;
  const email    = a.email    || FALLBACK.email;
  const phone    = a.phone    || FALLBACK.phone;
  const location = a.location || FALLBACK.location;

  const skills          = apiSkills.length      > 0 ? apiSkills      : FALLBACK.skills;
  const finalExperience = experience.length     > 0 ? experience     : FALLBACK.experience;
  const finalProjects   = projects.length       > 0 ? projects       : FALLBACK.projects;
  const finalEducation  = education.length      > 0 ? education.map((e: any) => ({
    degree: e.degree, school: e.institution, period: e.period, note: e.note,
  })) : FALLBACK.education;
  const finalCerts      = certs.length          > 0 ? certs.map((c: any) => ({
    name: c.name, org: c.issuer, date: c.date, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/30',
  })) : FALLBACK.certifications;

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">

      {/* ── Sticky top nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-mono text-sm text-green-400 shrink-0">~/pravakar</span>
          <a href="https://github.com/pravakar-rijal" target="_blank" rel="noreferrer"
            className="text-gray-500 hover:text-white transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>
        <div ref={navRef} className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeNav === item
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Hero / About ── */}
        <section id="about" className="px-6 py-14 border-b border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-full text-xs text-cyan-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Open to new opportunities
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{name}</h1>
          <p className="text-lg text-cyan-400 font-light mb-4">{title}</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{bio}</p>

          <div className="flex gap-3 flex-wrap mb-6">
            <a href={`mailto:${email}`}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-gray-100 transition-colors">
              <Mail className="w-4 h-4" /> Contact
            </a>
            <a href="https://github.com/pravakar-rijal" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm hover:border-gray-500 transition-colors">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://linkedin.com/in/pravakar-rijal" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-blue-800 bg-blue-950/30 rounded-lg text-sm text-blue-400 hover:border-blue-600 transition-colors">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </div>

          {/* Quick neofetch card */}
          <div className="bg-[#111] border border-white/8 rounded-xl p-4">
            <p className="text-xs text-gray-600 font-mono mb-3">~/pravakar$ neofetch</p>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                ['OS',     'Kathmandu, Nepal'],
                ['Role',   '.NET Developer'],
                ['Shell',  'C# / .NET Core'],
                ['Status', 'Open to opportunities'],
                ['Focus',  'Backend & Enterprise'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-cyan-400 w-16 shrink-0">{k}:</span>
                  <span className="text-gray-300">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-4 bg-[#0d1117] border border-white/5 rounded-xl text-center">
            <Globe className="w-6 h-6 mx-auto text-gray-700 mb-2" />
            <p className="text-xs text-gray-600 leading-relaxed">
              For the full interactive Linux desktop experience — visit on a desktop browser.
            </p>
          </div>
        </section>

        {/* ── Skills ── */}
        <section id="skills" className="px-6 py-12 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Code2 className="w-5 h-5 text-cyan-400" /> Technical Arsenal
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-xs">
                <span className="text-gray-200">{s.name}</span>
                <span className="text-cyan-500 font-mono text-[10px]">
                  {'▮'.repeat(s.level || 3)}{'▯'.repeat(5 - (s.level || 3))}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FALLBACK.skillGroups.map(cat => (
              <div key={cat.label} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">{cat.label}</h4>
                <ul className="space-y-1">
                  {cat.items.map(item => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-gray-300">
                      <ChevronRight className="w-2.5 h-2.5 text-cyan-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ── */}
        <section id="projects" className="px-6 py-12 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <FolderGit2 className="w-5 h-5 text-cyan-400" /> Featured Projects
          </h2>
          <div className="space-y-4">
            {finalProjects.map((p: any, i: number) => (
              <div key={i} className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm text-white">{p.name}</h3>
                  <Github className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(p.tech || []).map((t: string, j: number) => (
                    <span key={j} className="text-[10px] text-cyan-400 bg-cyan-950/50 border border-cyan-900/30 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section id="experience" className="px-6 py-12 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-cyan-400" /> Experience
          </h2>
          <div className="border-l-2 border-gray-800 pl-5 space-y-8">
            {finalExperience.map((e: any, i: number) => (
              <div key={i} className="relative">
                <div className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full -left-[26px] top-1 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                <div className="flex flex-col gap-1 mb-1">
                  <h3 className="font-semibold text-sm">{e.role}</h3>
                  <p className="text-cyan-400 text-xs">{e.company}</p>
                  <span className="text-[10px] text-gray-500 font-mono">{e.period}</span>
                </div>
                {e.description && <p className="text-gray-500 text-xs leading-relaxed mt-1">{e.description}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ── Education ── */}
        <section id="education" className="px-6 py-12 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-cyan-400" /> Education
          </h2>
          <div className="space-y-3 mb-8">
            {finalEducation.map((e: any, i: number) => (
              <div key={i} className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
                <h3 className="font-semibold text-sm">{e.degree}</h3>
                <p className="text-cyan-400 text-xs">{e.school}</p>
                <p className="text-gray-500 text-[10px] font-mono">{e.period}</p>
                {e.note && (
                  <p className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3" /> {e.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-yellow-400" /> Certifications
          </h2>
          <div className="space-y-2.5">
            {finalCerts.map((c: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 p-3 border rounded-xl ${c.bg}`}>
                <Award className={`w-4 h-4 shrink-0 ${c.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{c.name}</p>
                  <p className={`text-xs mt-0.5 ${c.color}`}>{c.org}</p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono shrink-0">{c.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Blog ── */}
        <section id="blog" className="px-6 py-12 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-cyan-400" /> Blog
          </h2>
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-800" />
              <p className="text-sm text-gray-600">No published posts yet.</p>
              <p className="text-xs text-gray-700 mt-1">Check back soon.</p>
            </div>
          )}
          {!loading && posts.length > 0 && (
            <div className="space-y-3">
              {posts.map((p: any) => (
                <div key={p.id} className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl">
                  <h3 className="font-semibold text-sm leading-snug mb-1">{p.title}</h3>
                  {p.excerpt && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{p.excerpt}</p>}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.slice(0, 3).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">{t}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-600 mt-2 font-mono">
                    {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="px-6 py-12">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-cyan-400" /> Get In Touch
          </h2>
          <div className="space-y-2.5 mb-8">
            {[
              { icon: <Mail     className="w-4 h-4 text-green-400" />,  label: 'Email',    val: email,    href: `mailto:${email}` },
              { icon: <Phone    className="w-4 h-4 text-blue-400"  />,  label: 'Phone',    val: phone,    href: `tel:${phone.replace(/[^+\d]/g, '')}` },
              { icon: <MapPin   className="w-4 h-4 text-red-400"   />,  label: 'Location', val: location, href: null },
              { icon: <Linkedin className="w-4 h-4 text-blue-500"  />,  label: 'LinkedIn', val: FALLBACK.linkedin, href: `https://${FALLBACK.linkedin}` },
              { icon: <Github   className="w-4 h-4 text-gray-300"  />,  label: 'GitHub',   val: FALLBACK.github,  href: `https://${FALLBACK.github}` },
            ].map(item => (
              item.href ? (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors group">
                  {item.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500">{item.label}</p>
                    <p className="text-sm text-gray-200 group-hover:text-white transition-colors truncate">{item.val}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 shrink-0" />
                </a>
              ) : (
                <div key={item.label}
                  className="flex items-center gap-3 p-3.5 bg-gray-900 border border-gray-800 rounded-xl">
                  {item.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.val}</p>
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="p-6 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 border border-cyan-900/30 rounded-xl text-center">
            <p className="text-base font-semibold text-cyan-400 mb-1">Available for .NET / Backend Roles</p>
            <p className="text-xs text-gray-400 mb-4">Open to full-time opportunities. Let's build something great.</p>
            <a href={`mailto:${email}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold rounded-lg transition-colors">
              <Mail className="w-4 h-4" /> Send a Message
            </a>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <div className="text-center py-3 text-[10px] text-gray-800 border-t border-white/5 shrink-0 font-mono">
        Pravakar Rijal © {new Date().getFullYear()} · pravakarrijal11@gmail.com
      </div>
    </div>
  );
}
