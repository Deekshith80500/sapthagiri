import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { User, Mail, Lock, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [role, setRole] = useState<'owner' | 'leader'>('owner');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    degree: '',
    address: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-8 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-500">Join the attendance tracking system</p>
        </div>

        {/* Role Toggle */}
        <div className="bg-gray-200/50 p-1 rounded-2xl flex mb-8">
          <button
            onClick={() => setRole('owner')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-medium transition-all ${
              role === 'owner' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            <Briefcase size={18} />
            Owner
          </button>
          <button
            onClick={() => setRole('leader')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] font-medium transition-all ${
              role === 'leader' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            <User size={18} />
            Team Leader
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="text"
              placeholder="Full Name"
              className="input-field !pl-12"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="email"
              placeholder="Email address"
              className="input-field !pl-12"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="input-field !pl-12"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="relative group">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="text"
              placeholder={role === 'owner' ? "Degree" : "Skill Level / Education"}
              className="input-field !pl-12"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              required
            />
          </div>

          {role === 'leader' && (
            <div className="relative group overflow-hidden">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type="text"
                placeholder="Leader Invitation Code"
                className="input-field !pl-12"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                required={role === 'leader'}
              />
            </div>
          )}

          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="text"
              placeholder="Address"
              className="input-field !pl-12"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              {error.includes("exists") && (
                <Link to="/login" className="text-xs text-red-500 hover:underline mt-1 inline-block font-semibold">
                  Go to Login →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
