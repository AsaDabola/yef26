import React from 'react';
import { Trophy, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard({ data, type = 'hours' }) {
  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-slate-400" />;
    if (index === 2) return <Trophy className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 text-center text-xs text-slate-400">{index + 1}</span>;
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        {type === 'hours' ? (
          <Clock className="w-4 h-4 text-blue-600" />
        ) : (
          <Users className="w-4 h-4 text-indigo-600" />
        )}
        <h3 className="font-semibold text-slate-800 text-sm">
          {type === 'hours' ? 'Top Evangelism Hours' : 'Most Students Reached'}
        </h3>
      </div>
      
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.id || index} className="flex items-center gap-3">
            <div className="w-6 flex justify-center">
              {getRankIcon(index)}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
              {item.profilePhoto ? (
                <img src={item.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  {item.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{item.name || 'Anonymous'}</p>
              <p className="text-xs text-slate-400">{item.chapterName}</p>
            </div>
            <div className={cn(
              "text-sm font-semibold",
              index === 0 ? "text-blue-600" : "text-slate-600"
            )}>
              {type === 'hours' ? `${item.value}h` : item.value}
            </div>
          </div>
        ))}
        
        {data.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
        )}
      </div>
    </div>
  );
}