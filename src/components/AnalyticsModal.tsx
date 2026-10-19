import React from 'react';
import {
  X,
  BarChart3,
  PieChart,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { CATEGORIES, getCategoryConfig } from '../utils/constants';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  selectedDate: string;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedDate,
}) => {
  if (!isOpen) return null;

  const dayTasks = items.filter((i) => i.date === selectedDate);
  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total hours scheduled
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  let totalMinutes = 0;
  let completedMinutes = 0;
  const categoryMinutes: Record<string, number> = {};

  dayTasks.forEach((t) => {
    const startM = toMinutes(t.startTime);
    const endM = toMinutes(t.endTime);
    const dur = Math.max(0, endM - startM);
    totalMinutes += dur;
    if (t.status === 'completed') completedMinutes += dur;

    categoryMinutes[t.category] = (categoryMinutes[t.category] || 0) + dur;
  });

  const totalHoursFormatted = (totalMinutes / 60).toFixed(1);
  const completedHoursFormatted = (completedMinutes / 60).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Laporan & Analisis Produktivitas
              </h3>
              <p className="text-xs text-slate-500">
                Statistik jadwal harian tanggal {selectedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-2xs font-semibold text-slate-500 block uppercase tracking-wider">
                Tingkat Selesai
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {completionRate}%
              </span>
              <span className="text-2xs text-slate-400">
                {completedTasks} dari {totalTasks} Tugas
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-2xs font-semibold text-slate-500 block uppercase tracking-wider">
                Waktu Terjadwal
              </span>
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                {totalHoursFormatted} Jam
              </span>
              <span className="text-2xs text-slate-400">
                Total agenda aktif
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-2xs font-semibold text-slate-500 block uppercase tracking-wider">
                Waktu Selesai
              </span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                {completedHoursFormatted} Jam
              </span>
              <span className="text-2xs text-slate-400">
                Fokus tuntas
              </span>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Distribusi Alokasi Waktu per Kategori
            </h4>

            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const mins = categoryMinutes[cat.id] || 0;
                if (mins === 0) return null;
                const hours = (mins / 60).toFixed(1);
                const percent = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${cat.bgLight}`}>
                          {cat.name}
                        </span>
                        <span className="text-slate-500 text-2xs">({hours} Jam)</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{percent}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Productivity Tip */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Tips Efisiensi:</strong> Jadwalkan tugas tersulit (Deep Work) di pagi hari saat energi kognitif sedang puncak. Batasi durasi rapat maksimal 45 menit untuk menjaga fokus.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
