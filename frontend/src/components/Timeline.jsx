import React from 'react';
import { Mail, Phone, MessageSquare, CheckSquare, FileText, Play, Pause } from 'lucide-react';

const formatDuration = (s) => {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const TimelineItem = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getBulletBg = () => {
    switch (item.type) {
      case 'email': return 'bg-amber-500 text-slate-950 border-amber-400';
      case 'call': return 'bg-emerald-500 text-white border-emerald-400';
      case 'sms': return 'bg-blue-500 text-white border-blue-400';
      case 'task': return 'bg-purple-500 text-white border-purple-400';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Connector line */}
      <div className="absolute left-[9px] top-4 -bottom-6 w-0.5 bg-slate-800 last:hidden"></div>

      {/* Bullet point icon */}
      <div className={`absolute left-0 top-1.5 flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 text-[10px] ${getBulletBg()}`}>
        {getIcon()}
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm transition-all hover:border-slate-700/85">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            {item.title}
            {item.type === 'email' && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                item.status === 'received' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {item.status || 'sent'}
              </span>
            )}
          </h4>
          <span className="text-[10px] text-slate-500">
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
          {item.desc}
        </div>

        {/* Dynamic Inline Audio Player for Call Recording Playbacks */}
        {item.type === 'call' && (item.duration > 0 || item.recordingUrl) && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-950 p-2 border border-slate-800/60 max-w-sm">
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-400">
              <Play className="h-3 w-3 fill-white" />
            </button>
            <div className="flex-1">
              <div className="h-1.5 rounded bg-slate-800 w-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3"></div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {formatDuration(item.duration || 120)}
            </span>
          </div>
        )}

        <div className="mt-3 border-t border-slate-800/60 pt-2 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
          <span>Action by: {item.user}</span>
        </div>
      </div>
    </div>
  );
};

const Timeline = ({ timeline }) => {
  const sorted = [...timeline].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 italic">
        No activities logged in this timeline yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map((item, idx) => (
        <TimelineItem key={idx} item={item} />
      ))}
    </div>
  );
};

export default Timeline;
