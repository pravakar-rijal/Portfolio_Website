import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.blog.adminGetPosts();
        setPosts(data.slice(0, 5));
        setStats({
          total: data.length,
          published: data.filter(p => p.published).length,
          drafts: data.filter(p => !p.published).length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 fade-in">
      <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-sm">
          <div className="text-sm text-gray-400 mb-1">Total Posts</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-sm">
          <div className="text-sm text-gray-400 mb-1">Published</div>
          <div className="text-4xl font-bold text-green-400">{stats.published}</div>
        </div>
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-sm">
          <div className="text-sm text-gray-400 mb-1">Drafts</div>
          <div className="text-4xl font-bold text-yellow-400">{stats.drafts}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Recent Posts</h3>
          <Link to="/admin/blog/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
            New Post
          </Link>
        </div>
        
        <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          {posts.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {posts.map(post => (
                <div key={post.id} className="p-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors">
                  <div>
                    <div className="font-medium text-white mb-1">{post.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${post.published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    <Link to={`/admin/blog/edit/${post.id}`} className="text-sm text-blue-400 hover:text-blue-300">Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No posts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
