import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, MapPin, Briefcase, X, Check, Search, Calendar, Camera } from 'lucide-react';
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
        <h2 className="text-3xl font-bold tracking-tight">Workers</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-transform"
        >
          <Plus size={24} />
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
            className="card p-5 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4 mb-4">
              {worker.photo ? (
                <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand/20 shadow-sm" />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <User size={24} />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{worker.name}</h3>
                <span className="text-xs font-bold uppercase text-brand/60 tracking-wider">
                  {worker.role}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
              {worker.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-300" />
                  <span>{worker.phone}</span>
                </div>
              )}
              {worker.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-300" />
                  <span className="truncate">{worker.address}</span>
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
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{isEditing ? 'Edit Profile' : 'Add New Worker'}</h3>
                <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-2 text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div 
                  onClick={() => setIsCapturing(true)}
                  className="relative cursor-pointer group"
                >
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl group-hover:opacity-75 transition-opacity" />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 group-hover:bg-gray-200 group-hover:border-brand/40 transition-all">
                      <Camera size={32} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Take Photo</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </div>
                </div>
                <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Mandatory Worker Profile</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Worker Full Name"
                    className="input-field !pl-12"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Phone Number (Optional)"
                    className="input-field !pl-12"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                  <select
                    className="input-field !pl-12 appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Home Address"
                    className="input-field !pl-12"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {error && <p className="text-red-500 text-sm px-2 animate-pulse">{error}</p>}

                <button type="submit" className="btn-primary w-full py-4 text-lg">
                  {isEditing ? 'Save Changes' : 'Register Worker'}
                </button>

                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); setSelectedWorker(null); }}
                    className="w-full py-3 text-sm text-gray-400 font-bold uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Worker Details Modal */}
      <AnimatePresence>
        {selectedWorker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorker(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-[80] p-8 max-w-lg mx-auto shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Worker Details</h3>
                <button onClick={() => setSelectedWorker(null)} className="p-2 text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {selectedWorker.photo ? (
                    <img src={selectedWorker.photo} alt={selectedWorker.name} className="w-20 h-20 rounded-3xl object-cover border-2 border-brand/10 shadow-md" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <User size={40} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-bold">{selectedWorker.name}</h4>
                    <p className="text-brand font-medium">{selectedWorker.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone Number</p>
                      <p className="font-medium text-brand">{selectedWorker.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Address</p>
                      <p className="font-medium text-brand">{selectedWorker.address || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registered On</p>
                      <p className="font-medium text-brand">
                        {new Date(selectedWorker.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleEdit(selectedWorker)}
                    className="btn-primary flex-1 py-4 text-lg"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedWorker.id)}
                    className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-500/10"
                  >
                    <X size={24} />
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
