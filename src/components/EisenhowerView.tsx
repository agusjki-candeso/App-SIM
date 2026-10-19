import React from 'react';
import {
  Flame,
  Calendar,
  Users,
  Archive,
  CheckCircle2,
  Timer,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { getCategoryConfig } from '../utils/constants';

interface EisenhowerViewProps {
  items: ScheduleItem[];
  selectedDate: string;
  onEditTask: (task: ScheduleItem) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (task: ScheduleItem) => void;
  onOpenPomodoro: (task: ScheduleItem) => void;
}

export const EisenhowerView: React.FC<EisenhowerViewProps> = ({
  items,
  selectedDate,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onOpenPomodoro,
}) => {
  const dayTasks = items.filter((i) => i.date === selectedDate);

  const quadrants = [
    {
      id: 'q1',
      title: 'Kuadran 1: Lakukan Segera (Do First)',
      subtitle: 'Mendesak & Penting — Prioritas Utama hari ini',
      icon: Flame,
      color: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200',
      tasks: dayTasks.filter((t) => t.priority === 'urgent'),
    },
    {
      id: 'q2',
      title: 'Kuadran 2: Rencanakan (Schedule / Deep Work)',
      subtitle: 'Penting tapi Tidak Mendesak — Investasi jangka panjang & pengembangan',
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
      tasks: dayTasks.filter((t) => t.priority === 'high'),
    },
    {
      id: 'q3',
      title: 'Kuadran 3: Delegasikan / Cepat (Delegate)',
      subtitle: 'Mendesak tapi Tidak Penting — Rapat singkat, balasan rutin, tugas admin',
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200',
      tasks: dayTasks.filter((t) => t.priority === 'medium'),
    },
    {
      id: 'q4',
      title: 'Kuadran 4: Kurangi / Hindari (Eliminate)',
      subtitle: 'Tidak Mendesak & Tidak Penting — Santai, hiburan pasif, tugas opsional',
      icon: Archive,
      color: 'text-slate-600 dark:text-slate-400',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
      tasks: dayTasks.filter((t) => t.priority === 'low'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-white">Metode Matriks Eisenhower:</strong> Bantu Anda memilah mana tugas yang benar-benar mendorong kemajuan vs sekadar menguras waktu Anda.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quadrant) => {
          const Icon = quadrant.icon;

          return (
            <div
              key={quadrant.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col min-h-[380px]"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${quadrant.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {quadrant.title}
                    </h3>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {quadrant.subtitle}
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${quadrant.badge}`}>
                  {quadrant.tasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-2.5 mt-3 overflow-y-auto max-h-[400px] pr-1">
                {quadrant.tasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Tidak ada agenda pada kuadran ini
                  </div>
                ) : (
                  quadrant.tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const catConfig = getCategoryConfig(task.category);

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-2xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                {task.startTime} - {task.endTime}
                              </span>
                              <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${catConfig.bgLight}`}>
                                {catConfig.name}
                              </span>
                            </div>

                            <h4
                              className={`text-xs font-bold ${
                                isCompleted
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenPomodoro(task)}
                              title="Timer Fokus"
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              <Timer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditTask(task)}
                              title="Edit"
                              className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleComplete(task)}
                              title={isCompleted ? 'Belum Selesai' : 'Selesai'}
                              className={`p-1 rounded-md ${
                                isCompleted ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
