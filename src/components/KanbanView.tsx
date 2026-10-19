import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Plus,
  Timer,
  Edit2,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { ScheduleItem, TaskStatus } from '../types/schedule';
import { getCategoryConfig, PRIORITY_CONFIG } from '../utils/constants';

interface KanbanViewProps {
  items: ScheduleItem[];
  selectedDate: string;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: ScheduleItem) => void;
  onDeleteTask: (id: string) => void;
  onOpenPomodoro: (task: ScheduleItem) => void;
  onAddTask: () => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  items,
  selectedDate,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  onOpenPomodoro,
  onAddTask,
}) => {
  const dayTasks = items.filter((i) => i.date === selectedDate);

  const columns: { id: TaskStatus; title: string; badgeColor: string; bg: string }[] = [
    {
      id: 'upcoming',
      title: 'Belum Dimulai',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-50/50 dark:bg-slate-900/40',
    },
    {
      id: 'in_progress',
      title: 'Sedang Berjalan',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50/30 dark:bg-blue-950/20',
    },
    {
      id: 'completed',
      title: 'Selesai',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
    },
    {
      id: 'overdue',
      title: 'Terlewat / Perlu Tindakan',
      badgeColor: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
      bg: 'bg-red-50/30 dark:bg-red-950/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = dayTasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-3xl p-4 border border-slate-200 dark:border-slate-800 ${col.bg} flex flex-col min-h-[500px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {col.title}
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  Tidak ada agenda di kolom ini
                </div>
              ) : (
                colTasks.map((task) => {
                  const catConfig = getCategoryConfig(task.category);

                  return (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {task.startTime} - {task.endTime}
                        </span>
                        <span
                          className={`text-2xs font-bold px-1.5 py-0.5 rounded border ${
                            PRIORITY_CONFIG[task.priority].badge
                          }`}
                        >
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className={`text-2xs font-medium px-2 py-0.5 rounded ${catConfig.bgLight}`}>
                          {catConfig.name}
                        </span>

                        {/* Status change actions */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'in_progress')}
                              title="Jalankan Sekarang"
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.id !== 'completed' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'completed')}
                              title="Tandai Selesai"
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenPomodoro(task)}
                            title="Timer Fokus"
                            className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                          >
                            <Timer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditTask(task)}
                            title="Edit"
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
  );
};
