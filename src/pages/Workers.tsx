import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, MapPin, Briefcase, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker } from '../types';

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Helper',
    address: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      if (res.ok) {
        const newWorker = await res.json();
        setWorkers([newWorker, ...workers]);
        setIsAdding(false);
        setFormData({ name: '', phone: '', role: 'Helper', address: '' });
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to add worker');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  if (loading) return null;

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

      <div className="space-y-3">
        {workers.map((worker) => (
          <motion.div 
            key={worker.id}
            layout
            onClick={() => setSelectedWorker(worker)}
            className="card p-5 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User size={24} />
              </div>
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

        {workers.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p>No workers in your database yet</p>
            <p className="text-sm">Click the + button to add one</p>
          </div>
        )}
      </div>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
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
                <h3 className="text-2xl font-bold">Add New Worker</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400">
                  <X size={24} />
                </button>
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
                  Register Worker
                </button>
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
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User size={40} />
                  </div>
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

                <button 
                  onClick={() => setSelectedWorker(null)}
                  className="btn-primary w-full py-4 text-lg"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
