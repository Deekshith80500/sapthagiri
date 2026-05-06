import React, { useState, useEffect, useContext } from 'react';
import { ShieldCheck, RefreshCw, Save, Globe, Lock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthContext } from '../App';

export default function Settings() {
  const [settings, setSettings] = useState({ leaderInviteCode: '', siteName: 'Attendance Hub' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleUpdateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSettings({ ...settings, leaderInviteCode: newCode });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Grid Config</h2>
          <p className="text-[10px] font-black uppercase text-brand tracking-[0.3em] mt-1">Central Distribution Controls</p>
        </div>
        <div className="w-16 h-16 bg-electric rounded-[24px] flex items-center justify-center text-slate-800 shadow-2xl shadow-electric/20 animate-zap">
          <Zap size={32} fill="currentColor" />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Leader Access Security */}
        <div className="card p-8 space-y-6 border-slate-900 bg-slate-900 shadow-2xl shadow-electric/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Zap size={40} className="text-electric opacity-10 animate-pulse" fill="currentColor" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-electric shadow-lg shadow-electric/20 flex items-center justify-center text-slate-900 animate-zap">
              <ShieldCheck size={28} strokeWidth={3} />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Transmission Security</h3>
              <p className="text-xs font-black text-electric uppercase tracking-widest leading-none">Authentication Tokens</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex-1 bg-white/5 border-2 border-white/10 p-6 rounded-[32px] shadow-inner flex items-center justify-between backdrop-blur-md">
              <span className="text-4xl font-mono font-black tracking-[0.2em] text-electric drop-shadow-[0_0_10px_#fbbf24]">{settings.leaderInviteCode}</span>
              <button
                type="button"
                onClick={handleUpdateCode}
                className="w-12 h-12 bg-electric hover:scale-110 active:scale-95 rounded-2xl transition-all flex items-center justify-center text-slate-900 shadow-xl shadow-electric/20"
                title="Regenerate code"
              >
                <RefreshCw size={22} strokeWidth={3} />
              </button>
            </div>
          </div>
          <div className="bg-electric/10 border border-electric/20 p-5 rounded-[24px] text-[10px] text-electric font-black uppercase tracking-wider leading-relaxed flex items-start gap-4">
            <Zap size={16} className="shrink-0 animate-zap" fill="currentColor" />
            Warning: Cycling the security key will disconnect all currently logged-in team leaders. Distributed keys must be manually updated.
          </div>
        </div>

        {/* General Site Settings */}
        <div className="card p-8 space-y-6 border-emerald-100 bg-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white">
              <Globe size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">Site Branding</h3>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Identify your workspace</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Workspace Name</label>
              <input
                type="text"
                className="input-field !bg-white !rounded-[24px] !py-4 !px-6 border-emerald-100 focus:ring-emerald-500/10 focus:border-emerald-500"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="e.g. Skyline Construction Site"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}
