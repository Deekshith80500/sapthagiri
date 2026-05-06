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
          <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-1">Grid Config</h2>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1">Central Distribution Controls</p>
        </div>
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-center text-electric shadow-2xl shadow-slate-900/40 animate-zap backdrop-blur-xl">
          <Zap size={32} fill="currentColor" />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Leader Access Security */}
        <div className="card p-8 space-y-6 border-white/5 bg-slate-950/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-electric/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-electric animate-zap">
              <ShieldCheck size={28} strokeWidth={3} />
            </div>
            <div>
              <h3 className="font-black text-white text-lg leading-tight">Transmission Security</h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Authentication Tokens</p>
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
        <div className="card p-8 space-y-6 border-white/5 bg-slate-950/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand">
              <Globe size={28} />
            </div>
            <div>
              <h3 className="font-black text-white text-lg leading-tight">Domain Branding</h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Digital Identifier</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 italic">Workspace Signal Name</label>
              <input
                type="text"
                className="w-full bg-slate-900/50 border-2 border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-brand/40 transition-all text-white placeholder:text-slate-600 font-bold italic"
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
          className="w-full py-5 bg-electric text-slate-950 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-electric/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? 'Transmitting...' : (
            <>
              <Save size={18} strokeWidth={3} />
              Commit Config
            </>
          )}
        </button>
      </form>
    </div>
  );
}
