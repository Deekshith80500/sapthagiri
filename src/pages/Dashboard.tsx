import React, { useState, useEffect, useContext } from 'react';
import { Users, UserCheck, UserX, Clock, ChevronRight, Info, ShieldCheck } from 'lucide-react';
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
    { label: 'Total Labours', value: workers.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Present Today', value: presentWorkers.length, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Absent Today', value: absentWorkers.length, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h2>
          <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        
        {user?.role === 'owner' && settings && (
          <div className="bg-brand/5 border border-brand/10 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Leader Code</p>
              <p className="font-mono font-bold text-brand">{settings.leaderInviteCode}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(settings.leaderInviteCode);
                alert("Code copied to clipboard!");
              }}
              className="ml-2 text-xs font-bold text-brand hover:underline"
            >
              Copy
            </button>
          </div>
        )}
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
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:rotate-6`}>
                <Icon className={stat.color} size={28} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
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
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="bg-green-50 px-6 py-3 border-b border-green-100">
                  <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <UserCheck size={16} /> Present workers ({presentWorkers.length})
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2">
                  {presentWorkers.map(w => (
                    <div key={w.id} className="flex items-center justify-between text-sm py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="font-medium text-gray-700">{w.name}</span>
                      <span className="text-[10px] font-bold uppercase text-gray-400">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Absent List */}
            {absentWorkers.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="bg-red-50 px-6 py-3 border-b border-red-100">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <UserX size={16} /> Absent workers ({absentWorkers.length})
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2">
                  {absentWorkers.map(w => (
                    <div key={w.id} className="flex items-center justify-between text-sm py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="font-medium text-gray-700">{w.name}</span>
                      <span className="text-[10px] font-bold uppercase text-gray-400">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingWorkers.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <Clock size={16} /> Not marked yet ({pendingWorkers.length})
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                   {pendingWorkers.map(w => (
                    <div key={w.id} className="text-xs text-gray-500 py-1">
                      • {w.name}
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
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Recent Workers</h3>
          </div>
          <div className="space-y-3">
            {workers.slice(0, 5).map((worker) => {
              const status = todayRecords.find(a => a.workerId === worker.id)?.status;
              return (
                <div key={worker.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{worker.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{worker.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {status ? (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        status === 'present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {status}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-400">
                        Pending
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-300" />
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
