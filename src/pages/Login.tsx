import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ArrowRight, Lock, User, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [role, setRole] = useState<'owner' | 'leader'>('owner');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          accessCode: role === 'leader' ? accessCode : '', 
          intendedRole: role 
        }),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-8 relative overflow-hidden bg-brand-light">
      {/* Background Image of electrical pole worker */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070&auto=format&fit=crop")' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand/40 via-brand-dark/20 to-brand-dark/60 mix-blend-multiply" />
      <div className="absolute inset-0 z-0 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/50"
      >
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-gray-500">Sign in to manage site attendance</p>
        </div>

        {/* Role Toggle */}
        <div className="bg-gray-200/50 p-1 rounded-2xl flex mb-8">
          <button
            type="button"
            onClick={() => { setRole('owner'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-medium transition-all ${
              role === 'owner' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            <Briefcase size={18} />
            Owner
          </button>
          <button
            type="button"
            onClick={() => { setRole('leader'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-medium transition-all ${
              role === 'leader' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            <User size={18} />
            Leader
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="text"
              placeholder="Full Name"
              className="input-field !pl-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {role === 'leader' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative group"
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type="text"
                placeholder="Leader Access Code"
                className="input-field !pl-12"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required={role === 'leader'}
              />
            </motion.div>
          )}

          {error && <p className="text-red-500 text-sm px-2 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : `Login as ${role === 'owner' ? 'Owner' : 'Team Leader'}`}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand font-semibold underline underline-offset-4">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
