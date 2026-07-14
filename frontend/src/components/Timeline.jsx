import { Mail, Phone, MessageSquare, CheckSquare, FileText, Play, Calendar } from 'lucide-react';

const formatDuration = (s) => {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const TimelineItem = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'email': return <Mail size={12} />;
      case 'call': return <Phone size={12} />;
      case 'sms': return <MessageSquare size={12} />;
      case 'task': return <CheckSquare size={12} />;
      case 'meeting':
      case 'event':
        return <Calendar size={12} />;
      default: return <FileText size={12} />;
    }
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0 font-sans">
      {/* Corner Bracket Connector Graphic */}
      <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-line last:hidden"></div>
      
      {/* Horizontal bracket notch */}
      <div className="absolute left-[9px] top-[22px] w-[14px] h-[2px] bg-gold"></div>

      {/* Bullet point icon */}
      <div className="absolute left-0 top-[12px] flex h-[20px] w-[20px] items-center justify-center rounded-full border border-gold bg-gold-soft text-gold shrink-0 z-10">
        {getIcon()}
      </div>

      {/* Item Body - Flat Card Treatment */}
      <div className="rounded-card border border-line bg-white p-5 hover:border-gold/30 transition-all duration-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-ink flex items-center gap-2">
            {item.title}
            {item.type === 'email' && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                item.status === 'received' ? 'bg-blue-50 text-blue-500 border-blue-200' : 'bg-gold-soft text-[#705d00] border-gold/20'
              }`}>
                {item.status || 'sent'}
              </span>
            )}
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
          {item.desc}
        </div>

        {item.type === 'call' && (item.duration > 0 || item.recordingUrl) && (
          <div className="mt-3 flex flex-col gap-2 rounded-btn bg-[#FAF9F6] p-3 border border-line max-w-sm">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase font-mono">
              <span>VoIP Call Recording</span>
              <span>{formatDuration(item.duration || 120)}</span>
            </div>
            {item.recordingUrl ? (
              <audio src={item.recordingUrl} controls className="w-full h-8 mt-1 outline-none" />
            ) : (
              <div className="flex items-center gap-3">
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink hover:bg-gold/90 transition-all">
                  <Play size={10} className="fill-current" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 rounded bg-line w-full overflow-hidden">
                    <div className="h-full bg-gold w-1/3"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-line pt-2 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
          {item.addedBySystem ? (
            <span className="bg-gold-soft text-[#705d00] px-2 py-0.5 rounded border border-gold/25 font-bold">Website Intake (Automated)</span>
          ) : (
            <span>Action by: {item.user}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Timeline = ({ timeline }) => {
  const sorted = [...timeline].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 italic font-sans">
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
export { Timeline };
