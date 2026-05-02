import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, ChevronDown, UserCheck, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import { Worker, AttendanceRecord } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';

export default function History() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [view, setView] = useState<'date' | 'worker'>('date');
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

  // Sort attendance by date descending
  const sortedAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date));
  
  // Group by date
  const groupedByDate: Record<string, AttendanceRecord[]> = {};
  sortedAttendance.forEach(a => {
    if (!groupedByDate[a.date]) groupedByDate[a.date] = [];
    groupedByDate[a.date].push(a);
  });

  const dates = Object.keys(groupedByDate).sort().reverse();

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">History</h2>
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
          <button 
            onClick={() => setView('date')}
            className={`px-4 py-1.5 rounded-[10px] text-xs font-bold uppercase transition-all ${
              view === 'date' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            By Date
          </button>
          <button 
            onClick={() => setView('worker')}
            className={`px-4 py-1.5 rounded-[10px] text-xs font-bold uppercase transition-all ${
              view === 'worker' ? 'bg-white shadow-sm text-brand' : 'text-gray-500'
            }`}
          >
            By Worker
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {view === 'date' ? (
          dates.map(date => {
            const records = groupedByDate[date];
            const present = records.filter(r => r.status === 'present').length;
            const absent = records.filter(r => r.status === 'absent').length;

            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">
                    {format(parseISO(date), 'EEEE, MMMM dd')}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{present} P</span>
                    <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md">{absent} A</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {records.map(record => {
                    const worker = workers.find(w => w.id === record.workerId);
                    return (
                      <div key={record.id} className="card p-4 flex items-center justify-between bg-white/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            record.status === 'present' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {record.status === 'present' ? <UserCheck size={16} /> : <UserX size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{worker?.name || 'Unknown Worker'}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{worker?.role}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          record.status === 'present' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          workers.map(worker => {
            const workerRecords = sortedAttendance.filter(a => a.workerId === worker.id);
            const present = workerRecords.filter(r => r.status === 'present').length;
            return (
              <div key={worker.id} className="card overflow-hidden !p-0">
                <div className="p-5 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{worker.name}</p>
                      <p className="text-xs text-gray-500">{worker.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{present}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Present</p>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto bg-gray-50/50">
                  {workerRecords.map(record => (
                    <div key={record.id} className="px-5 py-3 flex items-center justify-between border-b border-gray-100 last:border-0">
                      <span className="text-xs text-gray-500">{format(parseISO(record.date), 'MMM dd')}</span>
                      <span className={`text-[10px] font-bold uppercase ${
                        record.status === 'present' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                  {workerRecords.length === 0 && (
                    <p className="p-4 text-center text-xs text-gray-400 italic">No records found</p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {attendance.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>No history records yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
