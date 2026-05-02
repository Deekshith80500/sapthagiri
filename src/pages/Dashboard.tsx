import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Worker, AttendanceRecord } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/workers', { credentials: 'include' }).then(res => res.json()),
      fetch('/api/attendance', { credentials: 'include' }).then(res => res.json())
    ]).then(([workersData, attendanceData]) => {
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setLoading(false);
    });
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = attendance.filter(a => a.date === todayStr);
  const presentCount = todayRecords.filter(a => a.status === 'present').length;
  const absentCount = todayRecords.filter(a => a.status === 'absent').length;
  const totalCount = workers.length;

  const stats = [
    { label: 'Total Labours', value: totalCount, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Present Today', value: presentCount, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Absent Today', value: absentCount, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h2>
        <p className="text-gray-500">{format(new Date(), 'EEEE, MMMM do')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card flex items-center gap-6"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity / Worker List Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight">Recent Workers</h3>
          <button className="text-sm font-semibold text-brand px-2">View All</button>
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
                    <p className="font-bold">{worker.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{worker.role}</p>
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
          {workers.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No workers added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
