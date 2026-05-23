import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';
import { Clock, Loader2, Image as ImageIcon } from 'lucide-react';

const History = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const res = await fetchHistory(user?.email);
        setHistory(res.data.history || []);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm text-center p-4">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center p-4">
        No detection history available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Recent Detections</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div key={item.id} className="group relative rounded-xl overflow-hidden glass-panel cursor-pointer hover:-translate-y-1 transition-all duration-300">
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={`Detection ${item.id}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span className="text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 px-2 py-0.5 rounded-full">
                  {item.objectCount} Objects
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
