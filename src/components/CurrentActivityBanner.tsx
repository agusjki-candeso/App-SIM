import React from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  Timer,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScheduleItem } from '../types/schedule';
import { getCategoryConfig, PRIORITY_CONFIG } from '../utils/constants';
import { soundManager } from '../utils/sound';

interface CurrentActivityBannerProps {
  items: ScheduleItem[];
  selectedDate: string;
  onCompleteTask: (task: ScheduleItem) => void;
  onOpenPomodoro: (task: ScheduleItem) => void;
  onRollover: () => void;
  unfinishedCount: number;
  conflicts: Map<string, string[]>;
}

export const CurrentActivityBanner: React.FC<CurrentActivityBannerProps> = ({
  items,
  selectedDate,
  onCompleteTask,
  onOpenPomodoro,
  onRollover,
  unfinishedCount,
  conflicts,
}) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find active task (in_progress or current time is within bounds)
  const todayTasks = items.filter((i) => i.date === selectedDate);
  
  const activeTask = todayTasks.find((item) => {
    if (item.status === 'completed') return false;
    const [sh, sm] = item.startTime.split(':').map(Number);
    const [eh, em] = item.endTime.split(':').map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    return (currentMinutes >= sMin && currentMinutes < eMin) || item.status === 'in_progress';
  });

  // Find next upcoming task
  const nextTask = todayTasks
    .filter((item) => {
      if (item.status === 'completed' || item.id === activeTask?.id) return false;
      const [sh, sm] = item.startTime.split(':').map(Number);
      return sh * 60 + sm > currentMinutes;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Calculate remaining time for active task
  let remainingText = '';
  let progressPercent = 0;
  if (activeTask) {
    const [sh, sm] = activeTask.startTime.split(':').map(Number);
    const [eh, em] = activeTask.endTime.split(':').map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    const totalDuration = Math.max(1, eMin - sMin);
    const elapsed = Math.max(0, currentMinutes - sMin);
    const remaining = Math.max(0, eMin - currentMinutes);
    
    progressPercent = Math.min(100, Math.max(5, (elapsed / totalDuration) * 100));

    if (remaining > 60) {
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      remainingText = `Sisa ${hours} jam ${mins > 0 ? `${mins} mnt` : ''}`;
    } else if (remaining > 0) {
      remainingText = `Sisa ${remaining} menit`;
    } else {
      remainingText = 'Waktu jadwal telah berakhir';
    }
  }

  const handleQuickComplete = (task: ScheduleItem) => {
    soundManager.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    onCompleteTask(task);
  };

  const hasConflicts = conflicts.size > 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Rollover Alert if past unfinished tasks exist */}
      {unfinishedCount > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-2xl text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold">
                Ada {unfinishedCount} jadwal tertunda dari hari sebelumnya
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Pindahkan otomatis ke hari ini agar tidak terlewatkan.
              </p>
            </div>
          </div>
          <button
            onClick={onRollover}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            Pindahkan ke Hari Ini
          </button>
        </div>
      )}

      {/* Conflict Warning */}
      {hasConflicts && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-300 dark:border-red-800/50 rounded-2xl text-red-900 dark:text-red-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>Peringatan Tabrakan Jadwal:</strong> Ditemukan jadwal dengan jam yang tumpang tindih. Periksa tanda merah pada daftar jadwal.
          </span>
        </div>
      )}

      {/* Main Real-time Tracker Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 shadow-xl border border-indigo-900/50">
        {/* Glow effect background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Active Task Section (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                AKTIF SAAT INI
              </span>
              {activeTask && (
                <span className="text-xs font-medium text-slate-300">
                  {activeTask.startTime} - {activeTask.endTime}
                </span>
              )}
            </div>

            {activeTask ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white line-clamp-1">
                      {activeTask.title}
                    </h2>
                    {activeTask.description && (
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      PRIORITY_CONFIG[activeTask.priority].badge
                    }`}
                  >
                    {PRIORITY_CONFIG[activeTask.priority].label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>{remainingText}</span>
                    <span>{Math.round(progressPercent)}% Berjalan</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleQuickComplete(activeTask)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tandai Selesai</span>
                  </button>

                  <button
                    onClick={() => onOpenPomodoro(activeTask)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    <Timer className="w-4 h-4" />
                    <span>Mulai Timer Fokus</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-200">
                  Tidak Ada Jadwal Berlangsung Saat Ini
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Waktu luang atau istirahat. Anda bisa bersantai atau mempersiapkan agenda selanjutnya.
                </p>
              </div>
            )}
          </div>

          {/* Next Task / Summary Section (5 cols) */}
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                JADWAL BERIKUTNYA
              </span>
              <span>Hari Ini</span>
            </div>

            {nextTask ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800">
                    {nextTask.startTime} - {nextTask.endTime}
                  </span>
                  <span className="text-2xs text-slate-400">
                    {getCategoryConfig(nextTask.category).name}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {nextTask.title}
                </h4>
                {nextTask.description && (
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {nextTask.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2 text-center text-slate-400 text-xs">
                Semua agenda untuk hari ini telah selesai atau belum ada jadwal berikutnya.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
