import React, { useState, useEffect } from 'react';
import { Calendar, Download, Users, ChevronLeft, ChevronRight, Zap, User, X, Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker, AttendanceRecord } from '../types';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function History() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProof, setSelectedProof] = useState<{ record: AttendanceRecord, workerName: string } | null>(null);

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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Attendance Register - ${format(currentMonth, 'MMMM yyyy')}`, 14, 15);
    
    const head = [['Worker Name', ...daysInMonth.map(d => format(d, 'dd'))]];
    const body = workers.map(w => {
      const row = [w.name];
      daysInMonth.forEach(day => {
        const record = attendance.find(a => a.workerId === w.id && isSameDay(parseISO(a.date), day));
        row.push(record ? record.status === 'present' ? 'P' : 'A' : '-');
      });
      return row;
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [5, 150, 105] }, // Brand color (emerald-600 approx)
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 25 },
    });

    doc.save(`attendance_${format(currentMonth, 'MMMM_yyyy')}.pdf`);
  };

  const exportToCSV = () => {
    const header = ['Worker Name', ...daysInMonth.map(d => format(d, 'MMM dd'))];
    const rows = workers.map(w => {
      const row = [w.name];
      daysInMonth.forEach(day => {
        const record = attendance.find(a => a.workerId === w.id && isSameDay(parseISO(a.date), day));
        row.push(record ? record.status === 'present' ? 'P' : 'A' : '-');
      });
      return row;
    });

    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${format(currentMonth, 'MMMM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.1, 1], borderRadius: ["50% 50%", "30% 70%", "50% 50%"] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 rounded-full border-4 border-brand border-t-transparent shadow-lg shadow-brand/20"
      />
      <p className="text-brand font-bold animate-pulse text-sm uppercase tracking-widest">Marking Registers...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 leading-none">
            Grid <span className="text-brand">Logs</span>
            <Zap size={24} className="text-electric animate-zap" fill="currentColor" />
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1">High-Voltage Attendance Grid</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={exportToPDF} className="btn-secondary !bg-white/5 !border-white/10 !text-slate-400 hover:!bg-brand hover:!text-white transition-all py-2 text-[10px] font-black uppercase tracking-widest px-4">
            <Download size={14} /> PDF
          </button>
          <button onClick={exportToCSV} className="btn-secondary !bg-white/5 !border-white/10 !text-slate-400 hover:!bg-brand hover:!text-white transition-all py-2 text-[10px] font-black uppercase tracking-widest px-4">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card !p-3 flex items-center justify-between bg-slate-950/40 border-2 border-white/5 shadow-2xl backdrop-blur-xl">
        <button onClick={prevMonth} className="w-12 h-12 bg-white/5 hover:bg-brand hover:text-white rounded-2xl flex items-center justify-center transition-all text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center group cursor-pointer">
          <p className="text-[10px] font-black uppercase text-brand tracking-[0.3em] mb-1">Grid Period</p>
          <span className="font-black text-2xl text-white tracking-tight">{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        <button onClick={nextMonth} className="w-12 h-12 bg-white/5 hover:bg-brand hover:text-white rounded-2xl flex items-center justify-center transition-all text-slate-500">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Register Grid */}
      <div className="card p-0 overflow-hidden border-2 border-white/5 shadow-2xl group relative bg-slate-950/20 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="overflow-x-auto custom-scrollbar relative z-10">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/5">
                <th className="sticky left-0 bg-slate-950/95 backdrop-blur-md px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-white/10 z-20 w-56 border-r border-white/5">
                  Personnel / Day
                </th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className="px-1 py-5 text-center border-b border-white/10 min-w-[40px]">
                    <div className="text-[9px] uppercase font-black text-slate-600 tracking-tight mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-[14px] font-black text-slate-400">
                      {format(day, 'dd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workers.map((worker, idx) => (
                <motion.tr 
                  key={worker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-white/5 transition-colors group/row"
                >
                  <td className="sticky left-0 bg-slate-950/95 backdrop-blur-md px-8 py-4 z-10 border-r border-white/5 group-hover/row:bg-brand/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="relative group/photo">
                        {worker.photo ? (
                          <img src={worker.photo} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white/5 shadow-2xl transition-transform group-hover/photo:scale-110" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand">
                            <User size={18} strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-sm" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-white font-black text-sm block truncate tracking-tight leading-none mb-1">{worker.name}</span>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{worker.role}</p>
                      </div>
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const record = attendance.find(a => a.workerId === worker.id && isSameDay(parseISO(a.date), day));
                    return (
                      <td key={day.toString()} className="px-0 py-0 border-b border-white/5 text-center">
                        <div className="flex items-center justify-center p-1">
                          {record ? (
                            <motion.div 
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              onClick={() => record.capturePhoto && setSelectedProof({ record, workerName: worker.name })}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm transition-all ${
                                record.status === 'present' 
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                                  : 'bg-rose-500 text-white shadow-rose-500/30'
                              } ${record.capturePhoto ? 'cursor-pointer hover:scale-125 hover:z-20 active:scale-95' : ''}`}
                            >
                              {record.status === 'present' ? 'P' : 'A'}
                            </motion.div>
                          ) : (
                            <div className="text-white font-light text-xs opacity-10">/</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {workers.length === 0 && (
        <div className="py-20 text-center text-gray-400 card">
          <Users size={48} className="mx-auto mb-4 opacity-5 text-brand" />
          <p className="text-lg font-bold">No Records Found</p>
          <p className="text-sm">Start marking attendance to see history</p>
        </div>
      )}

      {/* Legend & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="card bg-emerald-500 text-white p-6 border-none shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Check size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Grid Active</p>
              <p className="text-3xl font-black">{attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth() && a.status === 'present').length}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-rose-500 text-white p-6 border-none shadow-2xl shadow-rose-500/20 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <X size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Off Line</p>
              <p className="text-3xl font-black">{attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth() && a.status === 'absent').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-slate-900 text-white p-6 border-none shadow-2xl shadow-slate-900/40 hover:scale-[1.02] transition-all group overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
              <Calendar size={24} strokeWidth={3} className="text-brand" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Uptime Days</p>
              <p className="text-3xl font-black">{new Set(attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth()).map(a => a.date)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProof && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProof(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-4 max-w-sm mx-auto h-fit bg-slate-950 rounded-[40px] overflow-hidden z-[110] shadow-2xl border-4 border-white/10"
            >
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-white/5">
                <div>
                  <h4 className="text-xl font-black tracking-tight">{selectedProof.workerName}</h4>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none mt-1">{format(parseISO(selectedProof.record.date), 'EEEE, MMMM dd')}</p>
                </div>
                <button onClick={() => setSelectedProof(null)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="aspect-square bg-slate-900 relative">
                <img 
                  src={selectedProof.record.capturePhoto} 
                  alt="Attendance proof" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 animate-zap">
                    <Check size={12} strokeWidth={4} className="text-slate-950" />
                    <span className="text-slate-950 text-[9px] font-black uppercase tracking-widest">Grid Verified</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-900 flex items-center justify-between border-t border-white/5">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Transmission Time</p>
                  <p className="text-xs font-black text-white italic">{format(parseISO(selectedProof.record.updatedAt), 'hh:mm:ss a')}</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-xl shadow-sm flex items-center justify-center text-brand border border-white/5">
                  <Camera size={20} strokeWidth={3} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

