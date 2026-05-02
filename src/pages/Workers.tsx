import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, MapPin, Briefcase, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker } from '../types';

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Helper',
    address: ''
  });

  const roles = ['Helper', 'Mason', 'Electrician', 'Plumber', 'Supervisor', 'Other'];

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => {
        setWorkers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (res.ok) {
      const newWorker = await res.json();
      setWorkers([newWorker, ...workers]);
      setIsAdding(false);
      setFormData({ name: '', phone: '', role: 'Helper', address: '' });
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
            className="card p-5"
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
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Worker Full Name"
                    className="input-field pl-12"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Phone Number (Optional)"
                    className="input-field pl-12"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    className="input-field pl-12 appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Home Address"
                    className="input-field pl-12"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-lg">
                  Register Worker
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
