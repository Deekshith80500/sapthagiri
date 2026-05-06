import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, MapPin, Briefcase, X, Check, Search, Calendar, Camera, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker } from '../types';
import CameraCapture from '../components/CameraCapture';

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Helper',
    address: '',
    photo: ''
  });

  const roles = ['Helper', 'Mason', 'Electrician', 'Plumber', 'Supervisor', 'Other'];

  useEffect(() => {
    fetch('/api/workers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setWorkers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load workers');
        setLoading(false);
      });
  }, []);

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      role: worker.role,
      address: worker.address || '',
      photo: worker.photo || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker and all their history? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/workers/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setWorkers(workers.filter(w => w.id !== id));
        setSelectedWorker(null);
      }
    } catch (err) {
      setError('Failed to delete worker');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = isEditing ? `/api/workers/${selectedWorker?.id}` : '/api/workers';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      if (res.ok) {
        const result = await res.json();
        if (isEditing) {
          setWorkers(workers.map(w => w.id === result.id ? result : w));
          setIsEditing(false);
          setSelectedWorker(null);
        } else {
          setWorkers([result, ...workers]);
          setIsAdding(false);
        }
        setFormData({ name: '', phone: '', role: 'Helper', address: '', photo: '' });
      } else {
        const data = await res.json();
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  if (loading) return null;

  const filteredWorkers = workers.filter(worker => 
    worker.name.toLowerCase().includes(search.toLowerCase()) ||
    worker.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Grid <span className="text-white">Force</span>
            <Zap size={24} className="text-electric animate-zap" fill="currentColor" />
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Live Personnel Database</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-white/5 text-white border border-white/10 rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-900/10 active:scale-95 transition-all hover:bg-electric hover:text-slate-900 group"
        >
          <Plus size={28} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
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

      <div className="space-y-3">
        {filteredWorkers.map((worker) => (
          <motion.div 
            key={worker.id}
            layout
            onClick={() => setSelectedWorker(worker)}
            className="card p-5 cursor-pointer active:scale-[0.98] transition-all bg-slate-950/20 border-white/5 hover:border-brand/30 group"
          >
            <div className="flex items-center gap-4 mb-4">
              {worker.photo ? (
                <img src={worker.photo} alt={worker.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/5 shadow-2xl group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand">
                  <User size={28} />
                </div>
              )}
              <div>
                <h3 className="font-black text-xl text-white tracking-tight">{worker.name}</h3>
                <span className="text-[10px] font-black uppercase text-brand bg-brand/10 px-3 py-1 rounded-full tracking-widest leading-none">
                  {worker.role}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-500">
              {worker.phone && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center">
                    <Phone size={12} className="text-blue-400" />
                  </div>
                  <span className="font-black text-[11px]">{worker.phone}</span>
                </div>
              )}
              {worker.address && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center">
                    <MapPin size={12} className="text-emerald-400" />
                  </div>
                  <span className="truncate font-black text-[11px]">{worker.address}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filteredWorkers.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p>{search ? 'No workers match your search' : 'No workers in your database yet'}</p>
            {!search && <p className="text-sm">Click the + button to add one</p>}
          </div>
        )}
      </div>

      {/* Add/Edit Worker Modal */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setIsEditing(false); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-slate-950 rounded-t-[40px] z-[80] p-8 max-w-lg mx-auto shadow-2xl overflow-y-auto max-h-[90vh] border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">{isEditing ? 'Sync Profile' : 'Grid Enrollment'}</h3>
                <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div 
                  onClick={() => setIsCapturing(true)}
                  className="relative cursor-pointer group"
                >
                  <div className="absolute -inset-2 bg-brand rounded-[38px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-36 h-36 rounded-[32px] object-cover border-4 border-slate-950 shadow-2xl group-hover:opacity-90 transition-all relative z-10" />
                  ) : (
                    <div className="w-36 h-36 rounded-[32px] bg-white/5 flex flex-col items-center justify-center text-brand border-4 border-slate-950 shadow-xl group-hover:bg-brand/10 transition-all relative z-10 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                      <Camera size={40} strokeWidth={2.5} className="mb-2 relative z-10" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Scan</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-electric text-slate-950 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform z-20 border-4 border-slate-950 animate-zap">
                    <Camera size={20} strokeWidth={3} />
                  </div>
                </div>
                <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Grid Ident Photo</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <User size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Worker Full Name"
                    className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-14 py-4 focus:outline-none focus:border-brand/40 transition-all text-white placeholder:text-slate-600 backdrop-blur-md font-black italic"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <Phone size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Contact Channel"
                    className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-14 py-4 focus:outline-none focus:border-brand/40 transition-all text-white placeholder:text-slate-600 backdrop-blur-md font-black italic"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <Briefcase size={16} strokeWidth={3} />
                  </div>
                  <select
                    className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-14 py-4 focus:outline-none focus:border-brand/40 transition-all text-white backdrop-blur-md font-black italic appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <MapPin size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Geo Location"
                    className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-14 py-4 focus:outline-none focus:border-brand/40 transition-all text-white placeholder:text-slate-600 backdrop-blur-md font-black italic"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {error && <p className="text-rose-500 font-black text-[10px] uppercase tracking-widest px-2 animate-pulse">{error}</p>}

                <button type="submit" className="w-full py-5 bg-electric text-slate-950 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-electric/20 mt-4 active:scale-95 transition-all">
                  {isEditing ? 'Sync Changes' : 'Confirm Enrollment'}
                </button>

                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); setSelectedWorker(null); }}
                    className="w-full py-3 text-xs text-slate-400 font-black uppercase tracking-widest hover:text-rose-500 transition-colors"
                  >
                    Discard Changes
                  </button>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Worker Details Modal */}
      <AnimatePresence>
        {selectedWorker && !isEditing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorker(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-slate-950 rounded-t-[40px] z-[80] p-8 max-w-lg mx-auto shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">Personnel Data</h3>
                <button onClick={() => setSelectedWorker(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[32px] border border-white/5 backdrop-blur-md">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-electric rounded-full opacity-10 blur-md animate-zap" />
                    {selectedWorker.photo ? (
                      <img src={selectedWorker.photo} alt={selectedWorker.name} className="w-24 h-24 rounded-[24px] object-cover border-4 border-slate-950 shadow-2xl relative z-10" />
                    ) : (
                      <div className="w-24 h-24 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand shadow-lg relative z-10">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{selectedWorker.name}</h4>
                    <span className="inline-block text-[10px] font-black uppercase text-slate-950 bg-electric px-3 py-1 rounded-full tracking-widest shadow-lg shadow-electric/20 animate-zap">
                      {selectedWorker.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white/5 rounded-[24px] border-2 border-white/5 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                      <Phone size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] leading-none mb-1">Transmission Channel</p>
                      <p className="font-black text-white text-sm italic">{selectedWorker.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-[24px] border-2 border-white/5 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                      <MapPin size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] leading-none mb-1">Geo Origin</p>
                      <p className="font-black text-white text-sm italic truncate max-w-[200px]">{selectedWorker.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-[24px] border-2 border-white/5 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                      <Calendar size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] leading-none mb-1">Grid Commission</p>
                      <p className="font-black text-white text-sm italic">
                        {new Date(selectedWorker.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => handleEdit(selectedWorker)}
                    className="flex-1 py-5 bg-electric text-slate-950 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-electric/20 active:scale-95 transition-all"
                  >
                    Overhaul Data
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedWorker.id)}
                    className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-[24px] flex items-center justify-center border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10"
                    title="Terminate Unit"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCapturing && (
          <CameraCapture 
            title="Worker Profile Photo"
            onCapture={(photo) => {
              setFormData({ ...formData, photo });
              setIsCapturing(false);
            }}
            onClose={() => setIsCapturing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
