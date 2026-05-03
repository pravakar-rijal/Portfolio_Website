import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';

export default function BlogList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await api.blog.adminGetPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.blog.delete(id);
      fetchPosts();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await api.blog.togglePublish(id);
      fetchPosts();
    } catch (err) {
      alert('Failed to toggle publish status');
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading posts...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tight">Blog Posts</h2>
        <Link to="/admin/blog/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
          New Post
        </Link>
      </div>
      
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{post.title}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleTogglePublish(post.id)}
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${post.published ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link to={`/admin/blog/edit/${post.id}`} className="text-blue-400 hover:text-blue-300 font-medium">Edit</Link>
                  <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No posts found. Create your first post!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
