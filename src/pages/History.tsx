import React, { useState, useEffect } from 'react';
import { Calendar, Download, Users, ChevronLeft, ChevronRight, Sparkles, User, X, Camera } from 'lucide-react';
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
          <h2 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            History <Sparkles size={20} className="text-brand animate-bounce" />
          </h2>
          <p className="text-gray-500">Traditional Register Grid View</p>
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
      <div className="card !p-2 flex items-center justify-between bg-white/50 backdrop-blur-xl border-brand/10">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-gray-400" />
        </button>
        <span className="font-bold text-lg text-gray-800">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Register Grid */}
      <div className="card p-0 overflow-hidden border-brand/10 shadow-xl shadow-brand/5 group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="sticky left-0 bg-gray-50/90 backdrop-blur-md px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-gray-500 border-b border-r border-gray-100 z-20 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                  Worker Name
                </th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className="px-1 py-4 text-center border-b border-gray-100 min-w-[35px]">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-tighter mix-blend-multiply">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-[13px] font-black text-gray-700">
                      {format(day, 'dd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, idx) => (
                <motion.tr 
                  key={worker.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-brand/[0.03] transition-colors group/row"
                >
                  <td className="sticky left-0 bg-white/95 backdrop-blur-md px-6 py-4 font-bold text-sm border-b border-r border-gray-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] group-hover/row:bg-brand/[0.03] transition-colors">
                    <div className="flex items-center gap-3">
                      {worker.photo ? (
                        <img src={worker.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                          <User size={14} />
                        </div>
                      )}
                      <div>
                        <span className="text-gray-800 line-clamp-1">{worker.name}</span>
                        <p className="text-[9px] text-gray-400 uppercase font-normal tracking-wide">{worker.role}</p>
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
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shadow-sm ${
                                record.status === 'present' 
                                  ? 'bg-green-100/80 text-green-700 border border-green-200' 
                                  : 'bg-red-100/80 text-red-700 border border-red-200'
                              } ${record.capturePhoto ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''}`}
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
      <div className="flex flex-wrap items-center gap-6 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6 text-sm text-gray-600 border-r border-gray-100 pr-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-100 border border-green-200 flex items-center justify-center text-[9px] font-black text-green-700">P</div>
            <span className="font-medium">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-100 border border-red-200 flex items-center justify-center text-[9px] font-black text-red-700">A</div>
            <span className="font-medium">Absent</span>
          </div>
        </div>
        
        <div className="flex flex-1 items-center gap-4 text-[11px] text-gray-400 font-bold uppercase tracking-widest overflow-x-auto whitespace-nowrap">
          <Calendar size={14} /> Total marked days this month: {new Set(attendance.filter(a => parseISO(a.date).getMonth() === currentMonth.getMonth()).map(a => a.date)).size}
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
              className="fixed inset-4 max-w-sm mx-auto h-fit bg-white rounded-3xl overflow-hidden z-[110] shadow-2xl"
            >
              <div className="bg-brand p-4 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold">{selectedProof.workerName}</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest">{format(parseISO(selectedProof.record.date), 'EEEE, MMMM dd')}</p>
                </div>
                <button onClick={() => setSelectedProof(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="aspect-square bg-gray-900 relative">
                <img 
                  src={selectedProof.record.capturePhoto} 
                  alt="Attendance proof" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] font-bold flex items-center gap-2">
                    <Camera size={12} className="text-brand" />
                    LIVE PHOTO PROOF CAPTURED
                  </p>
                </div>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">Time Captured: {format(parseISO(selectedProof.record.updatedAt), 'hh:mm a')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

