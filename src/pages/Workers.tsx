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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Grid <span className="text-brand">Force</span>
            <Zap size={24} className="text-electric animate-zap" fill="currentColor" />
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Live Personnel Database</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-900/10 active:scale-95 transition-all hover:bg-electric hover:text-slate-900 group"
        >
          <Plus size={28} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

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

      <div className="space-y-3">
        {filteredWorkers.map((worker) => (
          <motion.div 
            key={worker.id}
            layout
            onClick={() => setSelectedWorker(worker)}
            className="card p-5 cursor-pointer active:scale-[0.98] transition-all bg-white hover:bg-brand-light border-slate-100 hover:border-brand/20"
          >
            <div className="flex items-center gap-4 mb-4">
              {worker.photo ? (
                <img src={worker.photo} alt={worker.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-brand/20 shadow-md group-hover:rotate-2 transition-transform" />
              ) : (
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand">
                  <User size={28} />
                </div>
              )}
              <div>
                <h3 className="font-black text-xl text-slate-800">{worker.name}</h3>
                <span className="text-[10px] font-black uppercase text-brand bg-brand-light px-3 py-1 rounded-full tracking-wider">
                  {worker.role}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-500">
              {worker.phone && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                    <Phone size={12} className="text-brand" />
                  </div>
                  <span className="font-medium">{worker.phone}</span>
                </div>
              )}
              {worker.address && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                    <MapPin size={12} className="text-brand" />
                  </div>
                  <span className="truncate font-medium">{worker.address}</span>
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
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-[80] p-8 max-w-lg mx-auto shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800">{isEditing ? 'Edit Profile' : 'Register New Worker'}</h3>
                <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div 
                  onClick={() => setIsCapturing(true)}
                  className="relative cursor-pointer group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-br from-brand to-brand-dark rounded-[38px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-36 h-36 rounded-[32px] object-cover border-4 border-white shadow-2xl group-hover:opacity-90 transition-all relative z-10" />
                  ) : (
                    <div className="w-36 h-36 rounded-[32px] bg-slate-50 flex flex-col items-center justify-center text-brand border-4 border-white shadow-xl group-hover:bg-brand-light transition-all relative z-10 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
                      <Camera size={40} strokeWidth={2.5} className="mb-2 relative z-10" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Capture</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform z-20 border-4 border-white">
                    <Camera size={20} strokeWidth={3} />
                  </div>
                </div>
                <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Profile Photo</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <User size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Worker Full Name"
                    className="input-field !pl-14 !py-4 font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <Phone size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="input-field !pl-14 !py-4 font-bold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <Briefcase size={16} strokeWidth={3} />
                  </div>
                  <select
                    className="input-field !pl-14 !py-4 font-bold appearance-none bg-slate-50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:bg-brand group-focus-within:text-white transition-all">
                    <MapPin size={16} strokeWidth={3} />
                  </div>
                  <input
                    type="text"
                    placeholder="Home Address"
                    className="input-field !pl-14 !py-4 font-bold"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {error && <p className="text-rose-500 font-bold text-xs px-2 animate-pulse">{error}</p>}

                <button type="submit" className="btn-primary w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 mt-4">
                  {isEditing ? 'Save Profile' : 'Register Member'}
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
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-[80] p-8 max-w-lg mx-auto shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800">Worker Profile</h3>
                <button onClick={() => setSelectedWorker(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-brand rounded-full opacity-10 blur-md" />
                    {selectedWorker.photo ? (
                      <img src={selectedWorker.photo} alt={selectedWorker.name} className="w-24 h-24 rounded-[24px] object-cover border-4 border-white shadow-xl relative z-10" />
                    ) : (
                      <div className="w-24 h-24 bg-white rounded-[24px] flex items-center justify-center text-brand shadow-lg relative z-10">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{selectedWorker.name}</h4>
                    <span className="inline-block text-[10px] font-black uppercase text-white bg-brand px-3 py-1 rounded-full tracking-widest shadow-lg shadow-brand/20">
                      {selectedWorker.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white rounded-[24px] border-2 border-slate-50 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                      <Phone size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Live Contact</p>
                      <p className="font-bold text-slate-700">{selectedWorker.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-[24px] border-2 border-slate-50 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <MapPin size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Base Location</p>
                      <p className="font-bold text-slate-700 truncate max-w-[200px]">{selectedWorker.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-[24px] border-2 border-slate-50 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                      <Calendar size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Enrolled On</p>
                      <p className="font-bold text-slate-700">
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
                    className="btn-primary flex-1 py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20"
                  >
                    Modify Profile
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedWorker.id)}
                    className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[24px] flex items-center justify-center border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10"
                    title="Delete Worker"
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
