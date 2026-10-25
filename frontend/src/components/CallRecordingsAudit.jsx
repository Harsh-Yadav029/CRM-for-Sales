import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import api from '../utils/api';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Link } from 'react-router-dom';

const formatDuration = (secs) => {
  if (!secs) return '0:00';
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
};

const CallRecordingsAudit = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState([]);
  
  // Filters
  const [selectedRep, setSelectedRep] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('');
  const [search, setSearch] = useState('');

  // Audio Player State
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioElement, setAudioElement] = useState(null);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRep) params.append('repId', selectedRep);
      if (dispositionFilter) params.append('disposition', dispositionFilter);

      const { data } = await api.get(`/api/voice/recordings?${params.toString()}`);
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error('Failed to load call recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReps = async () => {
    try {
      const { data } = await api.get('/api/users');
      setReps(data || []);
    } catch (err) {
      console.error('Failed to fetch reps:', err);
    }
  };

  useEffect(() => {
    fetchReps();
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [selectedRep, dispositionFilter]);

  const togglePlay = (recId, url) => {
    if (!url) return;

    if (currentPlayingId === recId) {
      if (audioElement) {
        audioElement.pause();
      }
      setCurrentPlayingId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(url);
      newAudio.playbackRate = playbackSpeed;
      newAudio.play().catch(e => console.error("Playback error:", e));
      newAudio.onended = () => setCurrentPlayingId(null);
      setAudioElement(newAudio);
      setCurrentPlayingId(recId);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioElement) {
      audioElement.playbackRate = speed;
    }
  };

  const filteredRecordings = recordings.filter(r => {
    if (!search) return true;
    const term = search.toLowerCase();
    const repName = r.assignedTo?.name?.toLowerCase() || '';
    const leadName = r.relatedTo?.recordId?.name?.toLowerCase() || '';
    const phone = r.description?.toLowerCase() || '';
    return repName.includes(term) || leadName.includes(term) || phone.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Controls */}
      <Card variant="flat" className="p-5 bg-surface border border-outline/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Phone size={18} className="text-primary" />
              Sales Call Recordings & QA Monitoring
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Listen to recorded sales calls, evaluate prospect pitches, and inspect rep qualification quality.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Speed:</span>
            {[1, 1.25, 1.5, 2].map(speed => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                  playbackSpeed === speed
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline/40">
          <Input
            placeholder="Search prospect name, phone, or rep..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
            className="w-full text-xs"
          />

          <Select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="w-full text-xs bg-surface"
          >
            <option value="">All Sales Representatives</option>
            {reps.map(r => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.role})
              </option>
            ))}
          </Select>

          <Select
            value={dispositionFilter}
            onChange={(e) => setDispositionFilter(e.target.value)}
            className="w-full text-xs bg-surface"
          >
            <option value="">All Call Outcomes</option>
            <option value="interested">Interested</option>
            <option value="call_back_later">Call Back Later</option>
            <option value="not_interested">Not Interested</option>
            <option value="no_answer">No Answer</option>
            <option value="wrong_number">Wrong Number</option>
          </Select>
        </div>
      </Card>

      {/* Recordings Table / List */}
      <Card variant="flat" className="overflow-hidden border border-outline/60 bg-surface">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <Loader2 className="animate-spin text-primary" size={26} />
            <p className="text-xs font-medium">Loading call audio logs...</p>
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant">
            <Phone size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No call recordings found</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Outbound calls initiated through the CRM softphone will automatically appear here with their audio recordings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-variant/40 border-b border-outline/50 uppercase tracking-wider text-[10px] text-on-surface-variant font-semibold">
                <tr>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4">Prospect / Lead</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Disposition</th>
                  <th className="py-3 px-4 text-center">Audio Player</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/40">
                {filteredRecordings.map((rec) => {
                  const isPlaying = currentPlayingId === rec._id;
                  const leadObj = rec.relatedTo?.recordId;
                  const repName = rec.assignedTo?.name || 'Unknown Rep';
                  const dateStr = new Date(rec.startTime || rec.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={rec._id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-on-surface">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {repName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{repName}</p>
                            <p className="text-[10px] text-on-surface-variant capitalize">{rec.assignedTo?.role || 'rep'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {leadObj ? (
                          <div>
                            <Link
                              to={`/leads/${leadObj._id}`}
                              className="font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              {leadObj.name}
                              <ExternalLink size={10} />
                            </Link>
                            <p className="text-[10px] text-on-surface-variant">{leadObj.company || leadObj.phone}</p>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic">Direct Dial / Logged Call</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap font-mono text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-on-surface">
                        {formatDuration(rec.recordingDuration)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          rec.disposition === 'interested'
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                            : rec.disposition === 'not_interested'
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                            : 'bg-surface-variant/60 text-on-surface-variant'
                        }`}>
                          {rec.disposition ? rec.disposition.replace(/_/g, ' ') : 'Completed'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {rec.recordingUrl ? (
                          <div className="inline-flex items-center gap-2 bg-surface-variant/30 px-3 py-1.5 rounded-xl border border-outline/50">
                            <button
                              onClick={() => togglePlay(rec._id, rec.recordingUrl)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                isPlaying
                                  ? 'bg-primary text-on-primary scale-105'
                                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-on-primary'
                              }`}
                              title={isPlaying ? "Pause Recording" : "Play Recording"}
                            >
                              {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                            </button>
                            <span className="text-[11px] font-mono text-on-surface-variant">
                              {isPlaying ? 'Playing...' : 'Audio Ready'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/70 italic">Processing audio...</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {rec.recordingUrl && (
                          <a
                            href={rec.recordingUrl}
                            download={`call-${rec._id}.mp3`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant inline-flex items-center transition-colors"
                            title="Download Recording MP3"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CallRecordingsAudit;
