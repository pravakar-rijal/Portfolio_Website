import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function MediumSettings() {
  const [username, setUsername] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api.medium.getArticles();
      setUsername(data.mediumUsername || '');
      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const allProfile = await api.profile.getAll();
      await api.profile.updateSection('settings', { ...(allProfile.settings || {}), mediumUsername: username });
      alert('Saved');
    } catch (err) {
      alert('Failed to save');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.medium.sync();
      setArticles(res.articles || []);
      alert(`Synced ${res.synced} articles successfully`);
    } catch (err) {
      alert('Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">Medium Integration</h2>
      
      <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Medium Username (without @)</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="pravakarrijal"
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors" 
            />
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
              Save
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Cached Articles ({articles.length})</h3>
            <button onClick={handleSync} disabled={syncing || !username} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50">
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            {articles.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {articles.map((article, i) => (
                  <div key={i} className="p-4 hover:bg-gray-800/50 transition-colors">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:text-blue-300 mb-1 block">
                      {article.title}
                    </a>
                    <div className="text-xs text-gray-500">
                      {new Date(article.pub_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">No articles synced yet. Configure username and click Sync Now.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
