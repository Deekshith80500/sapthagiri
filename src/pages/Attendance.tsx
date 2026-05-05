import React, { useState, useEffect } from 'react';
import { Check, X, Calendar, Search, Camera } from 'lucide-react';
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
  const [activeCamera, setActiveCamera] = useState<{ id: string, name: string } | null>(null);

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
      setActiveCamera({ id: workerId, name: worker?.name || 'Worker' });
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Attendance</h2>
          <p className="text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <button 
          onClick={handleMarkAllPresent}
          className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-green-100 transition-colors"
        >
          <Check size={14} />
          Mark All Present
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or role..." 
          className="input-field !pl-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Worker List */}
      <div className="space-y-3">
        {filteredWorkers.map((worker) => (
          <div key={worker.id} className="card p-4 flex items-center justify-between group overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative">
                {worker.photo ? (
                  <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand/10 shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Calendar size={24} />
                  </div>
                )}
                {capturePhotos[worker.id] && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white"
                  >
                    <Camera size={10} strokeWidth={4} />
                  </motion.div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-800">{worker.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{worker.role}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(worker.id, 'present')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative overflow-hidden ${
                  marks[worker.id] === 'present' 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {marks[worker.id] === 'present' && capturePhotos[worker.id] ? (
                  <img src={capturePhotos[worker.id]} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Captured" />
                ) : null}
                <Check size={20} strokeWidth={3} className="relative z-10" />
              </button>
              <button
                onClick={() => handleToggle(worker.id, 'absent')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  marks[worker.id] === 'absent' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-100' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-24 bg-white/80 backdrop-blur-md p-4 -mx-6 mb-[-24px] border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="text-sm font-medium">
          <span className="text-green-600">{Object.values(marks).filter(m => m === 'present').length} Present</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-red-600">{Object.values(marks).filter(m => m === 'absent').length} Absent</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary px-8 flex items-center gap-2 ${
            saveStatus === 'success' ? 'bg-green-600' : ''
          }`}
        >
          {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Marks'}
          {saveStatus === 'success' && <Check size={18} />}
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
            onCapture={(photo) => handleCapture(activeCamera.id, photo)}
            onClose={() => setActiveCamera(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
