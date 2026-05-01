import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, GraduationCap, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import moment from 'moment';

const statusColors = {
  'Evangelized': 'bg-blue-100 text-blue-700',
  'Contact Exchanged': 'bg-indigo-100 text-indigo-700',
  'Bible Study Started': 'bg-purple-100 text-purple-700',
  'Bible Study In Progress': 'bg-violet-100 text-violet-700',
  'Visiting Fellowship': 'bg-green-100 text-green-700',
  'Connected to Chapter': 'bg-emerald-100 text-emerald-700',
  'Discipled / Serving': 'bg-teal-100 text-teal-700',
  'Not Interested / Closed': 'bg-slate-100 text-slate-500',
};

export default function StudentCard({ student, compact = false }) {
  return (
    <Link 
      to={createPageUrl(`StudentProfile?id=${student.id}`)}
      className={cn(
        "block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md hover:scale-[1.02]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-slate-400">
              {student.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{student.name}</h3>
              {student.universityName && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <GraduationCap className="w-3 h-3 flex-shrink-0" />
                  {student.universityName}
                </p>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = createPageUrl(`StudentChat?studentId=${student.id}`);
              }}
              className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={cn("text-[10px] font-medium px-2 py-0.5", statusColors[student.statusPipeline] || statusColors['Evangelized'])}>
              {student.statusPipeline || 'Evangelized'}
            </Badge>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {moment(student.created_date).fromNow()}
            </span>
          </div>
          
          {student.evangelizedByUserName && (
            <p className="text-[10px] text-slate-400 mt-1">
              by {student.evangelizedByUserName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}