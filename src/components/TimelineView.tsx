import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Timer,
  Edit2,
  Trash2,
  MapPin,
  CheckSquare,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { getCategoryConfig, PRIORITY_CONFIG } from '../utils/constants';

interface TimelineViewProps {
  items: ScheduleItem[];
  selectedDate: string;
  onEditTask: (task: ScheduleItem) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (task: ScheduleItem) => void;
  onOpenPomodoro: (task: ScheduleItem) => void;
  onAddTaskAtHour: (hourStr: string) => void;
  conflicts: Map<string, string[]>;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  items,
  selectedDate,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onOpenPomodoro,
  onAddTaskAtHour,
  conflicts,
}) => {
  const [currentMinuteOfDay, setCurrentMinuteOfDay] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinuteOfDay(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hours to show in timeline: 05:00 to 23:00 (19 hours)
  const START_HOUR = 5;
  const END_HOUR = 23;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const dayTasks = items.filter((i) => i.date === selectedDate);

  const getPositionStyles = (task: ScheduleItem) => {
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const timelineStart = START_HOUR * 60;
    const timelineTotal = (END_HOUR - START_HOUR + 1) * 60;

    const topPercent = Math.max(0, ((startMinutes - timelineStart) / timelineTotal) * 100);
    const durationMinutes = Math.max(25, endMinutes - startMinutes);
    const heightPercent = Math.min(100 - topPercent, (durationMinutes / timelineTotal) * 100);

    return {
      top: `${topPercent}%`,
      height: `${Math.max(4.5, heightPercent)}%`,
    };
  };

  const isToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return selectedDate === `${y}-${m}-${d}`;
  };

  const currentLineTopPercent =
    ((currentMinuteOfDay - START_HOUR * 60) / ((END_HOUR - START_HOUR + 1) * 60)) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Garis Waktu Harian Visual
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Klik pada area jam kosong untuk menambah agenda di jam tersebut
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Selesai
          </span>
          <span className="flex items-center gap-1 text-blue-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> Berjalan
          </span>
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Akan Datang
          </span>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="relative min-h-[900px] select-none">
        
        {/* Hour Rows */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {hours.map((hour) => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div key={hour} className="relative flex items-center h-12 group">
                <span className="w-14 text-xs font-mono font-medium text-slate-400 dark:text-slate-500 select-none">
                  {hourStr}
                </span>
                <div className="flex-1 border-t border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors"></div>
              </div>
            );
          })}
        </div>

        {/* Clickable Background Grid to Add Task */}
        <div className="absolute inset-0 left-16 flex flex-col justify-between">
          {hours.map((hour) => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <button
                key={`btn-${hour}`}
                onClick={() => onAddTaskAtHour(hourStr)}
                title={`Tambah agenda pukul ${hourStr}`}
                className="h-12 w-full text-left opacity-0 hover:opacity-100 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-lg transition-all flex items-center px-4 text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah agenda {hourStr}</span>
              </button>
            );
          })}
        </div>

        {/* Real-time Indicator Line (Only on Today) */}
        {isToday() && currentLineTopPercent >= 0 && currentLineTopPercent <= 100 && (
          <div
            className="absolute left-14 right-0 z-20 pointer-events-none flex items-center transition-all duration-1000"
            style={{ top: `${currentLineTopPercent}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20 shadow-md"></div>
            <div className="flex-1 h-0.5 bg-red-500"></div>
            <span className="bg-red-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full shadow-xs">
              Sekarang
            </span>
          </div>
        )}

        {/* Task Blocks Container */}
        <div className="absolute inset-0 left-16">
          {dayTasks.map((task) => {
            const pos = getPositionStyles(task);
            const catConfig = getCategoryConfig(task.category);
            const isConflict = conflicts.has(task.id);
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            return (
              <div
                key={task.id}
                style={{ top: pos.top, height: pos.height }}
                className={`absolute left-0 right-2 z-10 rounded-2xl p-3.5 transition-all duration-200 border shadow-xs group ${
                  isCompleted
                    ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-75'
                    : isInProgress
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-400/20'
                    : `${catConfig.bgLight} border-slate-200 dark:border-slate-700`
                } ${isConflict ? 'ring-2 ring-red-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 h-full">
                  {/* Task Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {task.startTime} - {task.endTime}
                        </span>

                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                          {catConfig.name}
                        </span>

                        {isConflict && (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-red-600 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> Jam Tabrakan
                          </span>
                        )}

                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full animate-pulse">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-bold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Subtask count */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 text-2xs text-slate-500 dark:text-slate-400 mt-1">
                        <CheckSquare className="w-3 h-3 text-blue-500" />
                        <span>
                          {task.subtasks.filter((s) => s.completed).length} /{' '}
                          {task.subtasks.length} Subtugas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenPomodoro(task)}
                      title="Mulai Fokus Pomodoro"
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Timer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onEditTask(task)}
                      title="Edit Agenda"
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="Hapus Agenda"
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onToggleComplete(task)}
                      title={isCompleted ? 'Batalkan Selesai' : 'Tandai Selesai'}
                      className={`p-1.5 rounded-xl transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
