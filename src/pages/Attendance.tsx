import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, Search, Camera, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker, AttendanceRecord } from '../types';
import { format } from 'date-fns';
import CameraCapture from '../components/CameraCapture';

export default function Attendance() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent'>>({});
  const [capturePhotos, setCapturePhotos] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<{ id: string, name: string, photo?: string } | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    Promise.all([
      fetch('/api/workers', { credentials: 'include' }).then(res => res.json()),
      fetch('/api/attendance', { credentials: 'include' }).then(res => res.json())
    ]).then(([workersData, attendanceData]) => {
      setWorkers(Array.isArray(workersData) ? workersData : []);
      
      // Load current day's marks if they exist
      const todayMarks: Record<string, 'present' | 'absent'> = {};
      const todayPhotos: Record<string, string> = {};
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach((a: AttendanceRecord) => {
          if (a.date === todayStr) {
            todayMarks[a.workerId] = a.status;
            if (a.capturePhoto) todayPhotos[a.workerId] = a.capturePhoto;
          }
        });
      }
      setMarks(todayMarks);
      setCapturePhotos(todayPhotos);
      setLoading(false);
    });
  }, []);

  const handleToggle = (workerId: string, status: 'present' | 'absent') => {
    if (status === 'present' && marks[workerId] !== 'present') {
      const worker = workers.find(w => w.id === workerId);
      setActiveCamera({ id: workerId, name: worker?.name || 'Worker', photo: worker?.photo });
      return;
    }

    setMarks(prev => ({
      ...prev,
      [workerId]: prev[workerId] === status ? '' : status
    } as any));

    if (status === 'absent') {
      setCapturePhotos(prev => {
        const next = { ...prev };
        delete next[workerId];
        return next;
      });
    }
  };

  const handleCapture = (workerId: string, photo: string) => {
    setMarks(prev => ({ ...prev, [workerId]: 'present' }));
    setCapturePhotos(prev => ({ ...prev, [workerId]: photo }));
    setActiveCamera(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    const records = Object.entries(marks)
      .filter(([_, status]) => status !== '')
      .map(([workerId, status]) => ({ 
        workerId, 
        status, 
        capturePhoto: status === 'present' ? capturePhotos[workerId] : undefined 
      }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, records }),
        credentials: 'include',
      });
      
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleMarkAllPresent = () => {
    const newMarks: Record<string, 'present' | 'absent'> = {};
    workers.forEach(w => {
      newMarks[w.id] = 'present';
    });
    setMarks(newMarks);
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Grid <span className="text-brand">RollCall</span>
            <Zap size={24} className="text-electric animate-zap" fill="currentColor" />
          </h2>
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar size={14} className="text-brand" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{format(new Date(), 'EEEE, MMMM dd')}</span>
          </div>
        </div>
        <button 
          onClick={handleMarkAllPresent}
          className="px-5 py-3 bg-white/5 text-white border border-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-electric hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10 active:scale-95 group"
        >
          <Zap size={14} className="group-hover:animate-zap" fill="currentColor" />
          Mark All
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or role..." 
          className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:border-brand/40 transition-all text-white placeholder:text-slate-600 backdrop-blur-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Worker List */}
      <div className="space-y-4">
        {filteredWorkers.map((worker) => (
          <motion.div 
            key={worker.id} 
            layout
            className={`card p-4 flex items-center justify-between group overflow-hidden border-2 transition-all duration-300 ${
              marks[worker.id] === 'present' 
                ? 'border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/10' 
                : marks[worker.id] === 'absent' 
                ? 'border-rose-500/30 bg-rose-500/10 shadow-rose-500/10' 
                : 'border-white/5 bg-slate-950/20 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                {worker.photo ? (
                  <img src={worker.photo} alt={worker.name} className={`w-14 h-14 rounded-2xl object-cover border-2 transition-all ${marks[worker.id] === 'present' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : marks[worker.id] === 'absent' ? 'border-rose-500 shadow-lg shadow-rose-500/20' : 'border-white/5 shadow-sm'}`} />
                ) : (
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
                    <User size={28} />
                  </div>
                )}
                {capturePhotos[worker.id] && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 w-7 h-7 bg-emerald-500 rounded-xl border-4 border-slate-950 flex items-center justify-center text-white shadow-xl"
                  >
                    <Camera size={12} strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <div>
                <p className={`font-black text-lg tracking-tight ${marks[worker.id] ? 'text-white' : 'text-slate-300'}`}>{worker.name}</p>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                  marks[worker.id] === 'present' ? 'bg-emerald-500/10 text-emerald-400' : 
                  marks[worker.id] === 'absent' ? 'bg-rose-500/10 text-rose-400' : 
                  'bg-white/5 text-slate-500'
                }`}>
                  {worker.role}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(worker.id, 'present')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative overflow-hidden ${
                  marks[worker.id] === 'present' 
                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' 
                    : 'bg-white/5 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-500'
                }`}
              >
                {marks[worker.id] === 'present' && capturePhotos[worker.id] ? (
                  <img src={capturePhotos[worker.id]} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px]" alt="Captured" />
                ) : null}
                <Check size={24} strokeWidth={4} className="relative z-10" />
              </button>
              <button
                onClick={() => handleToggle(worker.id, 'absent')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  marks[worker.id] === 'absent' 
                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' 
                    : 'bg-white/5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-500'
                }`}
              >
                <X size={24} strokeWidth={4} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-24 bg-slate-950/80 backdrop-blur-xl p-6 -mx-6 mb-[-24px] border-t border-white/5 flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="text-sm font-black flex gap-4">
          <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{Object.values(marks).filter(m => m === 'present').length} Marked</span>
          <span className="text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">{Object.values(marks).filter(m => m === 'absent').length} Cut</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-10 py-4 rounded-2xl flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
            saveStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'bg-electric text-slate-950 shadow-electric/20'
          }`}
        >
          {saving ? 'Syncing...' : saveStatus === 'success' ? 'Synchronized' : 'Commit Grid'}
          {saveStatus === 'success' && <Check size={18} strokeWidth={4} />}
          {!saving && saveStatus !== 'success' && <Zap size={18} fill="currentColor" className="animate-zap" />}
        </button>
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>No workers matched your search</p>
        </div>
      )}

      <AnimatePresence>
        {activeCamera && (
          <CameraCapture 
            title={`Check-in: ${activeCamera.name}`}
            profilePhoto={activeCamera.photo}
            onCapture={(photo) => handleCapture(activeCamera.id, photo)}
            onClose={() => setActiveCamera(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
