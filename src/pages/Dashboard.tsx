import React, { useState, useEffect, useContext } from 'react';
import { Users, UserCheck, UserX, Clock, ChevronRight, Info, ShieldCheck, Zap, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Worker, AttendanceRecord } from '../types';
import { format } from 'date-fns';
import { AuthContext } from '../App';

export default function Dashboard() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, aRes] = await Promise.all([
          fetch('/api/workers', { credentials: 'include' }),
          fetch('/api/attendance', { credentials: 'include' })
        ]);
        const workersData = await wRes.json();
        const attendanceData = await aRes.json();
        
        setWorkers(Array.isArray(workersData) ? workersData : []);
        setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

        if (user?.role === 'owner') {
          const sRes = await fetch('/api/settings', { credentials: 'include' });
          if (sRes.ok) {
            setSettings(await sRes.json());
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = attendance.filter(a => a.date === todayStr);
  
  const presentWorkers = workers.filter(w => todayRecords.find(a => a.workerId === w.id && a.status === 'present'));
  const absentWorkers = workers.filter(w => todayRecords.find(a => a.workerId === w.id && a.status === 'absent'));
  const pendingWorkers = workers.filter(w => !todayRecords.find(a => a.workerId === w.id));

  const stats = [
    { label: 'Total Labours', value: workers.length, icon: Users, color: 'text-white', bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Present Today', value: presentWorkers.length, icon: UserCheck, color: 'text-white', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Absent Today', value: absentWorkers.length, icon: UserX, color: 'text-white', bg: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600' },
  ];

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-electric rounded-2xl flex items-center justify-center text-slate-800 shadow-lg shadow-electric/20 animate-zap">
              <Zap size={20} strokeWidth={3} fill="currentColor" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{settings?.siteName || 'Dashboard'}</h2>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={14} className="text-brand" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
          </div>
        </div>
        
        {user?.role === 'owner' && settings && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand">
              <ShieldCheck size={24} strokeWidth={3} />
            </div>
            <div className="pr-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Leader Access Code</p>
              <p className="text-xl font-mono font-black text-brand tracking-widest">{settings.leaderInviteCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="card p-8 bg-slate-900 text-white border-4 border-electric/20 shadow-2xl shadow-electric/10 relative overflow-hidden group">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-64 h-64 bg-electric rounded-full blur-[80px]" 
          />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-electric animate-pulse" fill="currentColor" />
                <h3 className="text-lg font-black uppercase tracking-[0.2em] text-electric">Power Status</h3>
              </div>
              <div className="px-3 py-1 bg-electric/10 border border-electric/20 rounded-full backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase text-electric">Live Grid</span>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                  <motion.circle 
                    cx="72" cy="72" r="64" stroke="#fbbf24" strokeWidth="12" fill="transparent" 
                    initial={{ strokeDashoffset: 402 }}
                    animate={{ strokeDashoffset: 402 * (1 - (presentWorkers.length / (workers.length || 1))) }}
                    strokeDasharray={402}
                    className="drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-electric">{Math.round((presentWorkers.length / (workers.length || 1)) * 100)}%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Load</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-electric shadow-[0_0_10px_#fbbf24]" />
                  <span className="text-sm font-black text-white">{presentWorkers.length} Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                  <span className="text-sm font-black text-slate-400">{absentWorkers.length} Off-line</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 border border-slate-700 rounded-full" />
                  <span className="text-sm font-black text-slate-500">{pendingWorkers.length} Standby</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8 bg-white border-2 border-brand/5 shadow-2xl shadow-slate-900/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand/5 rounded-full blur-2xl" />
          <div className="w-20 h-20 bg-brand-light text-brand rounded-[32px] flex items-center justify-center mb-6 shadow-inner">
            <Info size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Automated Logs</h3>
          <p className="text-sm text-slate-400 font-bold mb-8 max-w-[200px] leading-relaxed">Systematic attendance records for all team members.</p>
          <button 
            onClick={() => {
              const summary = `Daily Attendance Summary (${format(new Date(), 'MMM d, yyyy')})\n\nTotal Workers: ${workers.length}\nPresent: ${presentWorkers.length}\nAbsent: ${absentWorkers.length}\nPending: ${pendingWorkers.length}\n\nGenerated from ${settings?.siteName || 'Attendance Hub'}.`;
              navigator.clipboard.writeText(summary);
              alert("Daily summary copied to clipboard!");
            }}
            className="w-full max-w-[200px] py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-electric hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 group"
          >
            <Zap size={14} className="group-hover:animate-zap" fill="currentColor" />
            Copy Summary
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
              className="card flex items-center gap-6 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} shadow-lg shadow-${stat.bg.split('-')[1]}-500/30 flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:rotate-6`}>
                <Icon className={stat.color} size={28} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Status Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Summary */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Detailed Summary
            <span className="text-xs font-normal text-gray-400"> (Today)</span>
          </h3>
          
          <div className="space-y-6">
            {/* Present List */}
            {presentWorkers.length > 0 && (
              <div className="bg-white rounded-[32px] border-2 border-emerald-50 overflow-hidden shadow-xl shadow-emerald-500/5">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-5">
                  <p className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <UserCheck size={20} strokeWidth={3} /> {presentWorkers.length} Active Professionals
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-emerald-50/20">
                  {presentWorkers.map(w => (
                    <div key={w.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-2xl shadow-sm border border-emerald-100/50 group hover:scale-[1.02] transition-transform">
                      <span className="font-black text-slate-700 text-xs">{w.name}</span>
                      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 flex items-center justify-center px-2 py-0.5 rounded-full">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Absent List */}
            {absentWorkers.length > 0 && (
              <div className="bg-white rounded-[32px] border-2 border-rose-50 overflow-hidden shadow-xl shadow-rose-500/5">
                <div className="bg-gradient-to-r from-rose-500 to-rose-400 px-8 py-5">
                  <p className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <UserX size={20} strokeWidth={3} /> {absentWorkers.length} Absent Today
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-rose-50/20">
                  {absentWorkers.map(w => (
                    <div key={w.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-2xl shadow-sm border border-rose-100/50 group hover:scale-[1.02] transition-transform">
                      <span className="font-black text-slate-700 text-xs">{w.name}</span>
                      <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 flex items-center justify-center px-2 py-0.5 rounded-full">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingWorkers.length > 0 && (
              <div className="bg-white rounded-[32px] border-2 border-amber-50 overflow-hidden shadow-xl shadow-amber-500/5">
                <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-8 py-5">
                  <p className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Clock size={20} strokeWidth={3} /> {pendingWorkers.length} Pending Attention
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-amber-50/20">
                   {pendingWorkers.map(w => (
                    <div key={w.id} className="text-[10px] text-amber-700 font-black uppercase bg-white border border-amber-100/50 rounded-xl py-3 px-3 shadow-sm text-center">
                      {w.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workers.length === 0 && (
              <div className="card p-12 text-center text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No workers added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Worker List Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em] bg-brand-light px-3 py-1 rounded-full">Top 5</span>
          </div>
          <div className="space-y-4">
            {workers.slice(0, 5).map((worker) => {
              const status = todayRecords.find(a => a.workerId === worker.id)?.status;
              return (
                <div key={worker.id} className="card p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {worker.photo ? (
                        <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-xl object-cover border-2 border-brand/10 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center text-brand">
                          <UserIcon size={20} />
                        </div>
                      )}
                      <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        status === 'present' ? 'bg-emerald-500' : status === 'absent' ? 'bg-rose-500' : 'bg-slate-300'
                      }`} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 tracking-tight">{worker.name}</p>
                      <p className="text-[10px] text-brand font-black uppercase tracking-widest">{worker.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      status === 'present' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10' 
                        : status === 'absent' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm shadow-rose-500/10' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {status || 'Pending'}
                    </div>
                    <ChevronRight size={18} className="text-slate-200 group-hover:text-brand transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline helper for User icon since it's not imported directly by name Icon
function UserIcon({ size }: { size: number }) {
  return <Users size={size} />;
}
