import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tags: '',
    cover_image: '',
    excerpt: '',
    content: '',
    published: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.blog.adminGetPost(Number(id)).then(data => {
        setFormData({
          title: data.title || '',
          tags: data.tags ? data.tags.join(', ') : '',
          cover_image: data.cover_image || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          published: data.published || false
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (isEdit) { await api.blog.update(Number(id), payload); }
      else { await api.blog.create(payload); }
      setSaved(true);
      setTimeout(() => navigate('/admin/blog'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading editor...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{isEdit ? 'Edit Post' : 'New Post'}</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/blog')} className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`px-6 py-2 rounded font-medium text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'}`}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}

      <div className="space-y-4 bg-gray-950 p-6 rounded-xl border border-gray-800">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="Your post title..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg font-medium focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              placeholder=".NET, C#, Architecture"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Cover Image URL</label>
            <input
              type="text"
              value={formData.cover_image}
              onChange={e => setFormData({...formData, cover_image: e.target.value})}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={e => setFormData({...formData, excerpt: e.target.value})}
            rows={2}
            placeholder="A short description shown in the blog list..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors resize-none text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Content</label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs px-3 py-1 rounded transition-colors ${showPreview ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-gray-500 hover:text-gray-300 border border-gray-700'}`}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {showPreview ? (
            <div className="w-full min-h-[380px] bg-gray-900 border border-gray-700 rounded-lg px-6 py-4 prose prose-invert prose-sm max-w-none overflow-auto">
              {formData.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.content}</ReactMarkdown>
              ) : (
                <p className="text-gray-600 italic">Nothing to preview yet...</p>
              )}
            </div>
          ) : (
            <textarea
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              rows={18}
              placeholder="Write your post in Markdown...&#10;&#10;## Heading&#10;&#10;**Bold text**, *italic*, `code`, [links](url)&#10;&#10;```csharp&#10;public class Example { }&#10;```"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-mono text-sm resize-none"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setFormData({...formData, published: !formData.published})}
              className={`w-10 h-5 rounded-full transition-colors relative ${formData.published ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${formData.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              {formData.published ? 'Published — visible to visitors' : 'Draft — not visible yet'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
