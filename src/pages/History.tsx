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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 leading-none">
            Grid <span className="text-brand">Logs</span>
            <Zap size={24} className="text-electric animate-zap" fill="currentColor" />
          </h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-1">High-Voltage Attendance Grid</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={exportToPDF} className="btn-secondary flex items-center gap-2 py-2 text-sm bg-brand/5 border-brand/20 text-brand hover:bg-brand hover:text-white transition-all">
            <Download size={16} /> Export PDF
          </button>
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2 py-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card !p-3 flex items-center justify-between bg-white border-2 border-brand/5 shadow-xl shadow-brand/5">
        <button onClick={prevMonth} className="w-12 h-12 bg-slate-50 hover:bg-brand-light hover:text-brand rounded-2xl flex items-center justify-center transition-all">
          <ChevronLeft size={24} className="text-slate-400 group-hover:text-brand" />
        </button>
        <div className="text-center group cursor-pointer">
          <p className="text-[10px] font-black uppercase text-brand tracking-[0.3em] mb-1">Select Period</p>
          <span className="font-black text-2xl text-slate-800 tracking-tight">{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        <button onClick={nextMonth} className="w-12 h-12 bg-slate-50 hover:bg-brand-light hover:text-brand rounded-2xl flex items-center justify-center transition-all">
          <ChevronRight size={24} className="text-slate-400 group-hover:text-brand" />
        </button>
      </div>

      {/* Register Grid */}
      <div className="card p-0 overflow-hidden border-2 border-brand/5 shadow-2xl shadow-brand/10 group relative bg-white/80 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="overflow-x-auto custom-scrollbar relative z-10">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="sticky left-0 bg-white/95 backdrop-blur-md px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b-2 border-r-2 border-slate-50 z-20 w-56">
                  Personnel / Day
                </th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className="px-1 py-5 text-center border-b-2 border-slate-50 min-w-[40px]">
                    <div className="text-[9px] uppercase font-black text-slate-300 tracking-tight mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-[14px] font-black text-slate-600">
                      {format(day, 'dd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workers.map((worker, idx) => (
                <motion.tr 
                  key={worker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-brand/[0.02] transition-colors group/row"
                >
                  <td className="sticky left-0 bg-white/95 backdrop-blur-md px-8 py-4 z-10 border-r-2 border-slate-50 group-hover/row:bg-brand/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="relative group/photo">
                        {worker.photo ? (
                          <img src={worker.photo} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-brand/10 shadow-sm transition-transform group-hover/photo:scale-110" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand">
                            <User size={18} strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-800 font-black text-sm block truncate tracking-tight">{worker.name}</span>
                        <p className="text-[9px] text-brand font-black uppercase tracking-widest">{worker.role}</p>
                      </div>
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const record = attendance.find(a => a.workerId === worker.id && isSameDay(parseISO(a.date), day));
                    return (
                      <td key={day.toString()} className="px-0 py-0 border-b border-gray-100 text-center">
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
                              } ${record.capturePhoto ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                            >
                              {record.status === 'present' ? 'P' : 'A'}
                            </motion.div>
                          ) : (
                            <div className="text-gray-200 font-light text-xs opacity-40">/</div>
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
        <div className="card bg-emerald-500 text-white p-6 border-none shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Check size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Present</p>
              <p className="text-3xl font-black">{attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth() && a.status === 'present').length}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-rose-500 text-white p-6 border-none shadow-xl shadow-rose-500/20 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <X size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Absent</p>
              <p className="text-3xl font-black">{attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth() && a.status === 'absent').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-brand text-white p-6 border-none shadow-xl shadow-brand/20 hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Calendar size={24} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Days Active</p>
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
              className="fixed inset-4 max-w-sm mx-auto h-fit bg-white rounded-[40px] overflow-hidden z-[110] shadow-2xl border-4 border-white"
            >
              <div className="bg-gradient-to-r from-brand to-brand-dark p-6 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black tracking-tight">{selectedProof.workerName}</h4>
                  <p className="text-[10px] font-black opacity-80 uppercase tracking-widest leading-none mt-1">{format(parseISO(selectedProof.record.date), 'EEEE, MMMM dd')}</p>
                </div>
                <button onClick={() => setSelectedProof(null)} className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20">
                    <Check size={12} strokeWidth={4} className="text-white" />
                    <span className="text-white text-[9px] font-black uppercase tracking-widest underline decoration-white/30 decoration-2 underline-offset-2">Verified Identity</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Timestamp</p>
                  <p className="text-xs font-black text-slate-600">{format(parseISO(selectedProof.record.updatedAt), 'hh:mm:ss a')}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand">
                  <Camera size={18} strokeWidth={3} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

