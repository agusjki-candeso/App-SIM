import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Timer,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Coffee,
} from 'lucide-react';
import { ScheduleItem, Category, Priority, TaskStatus } from '../types/schedule';
import { CATEGORIES, getCategoryConfig, PRIORITY_CONFIG } from '../utils/constants';

interface AgendaListViewProps {
  items: ScheduleItem[];
  selectedDate: string;
  onEditTask: (task: ScheduleItem) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (task: ScheduleItem) => void;
  onToggleSubtask: (task: ScheduleItem, subtaskId: string) => void;
  onOpenPomodoro: (task: ScheduleItem) => void;
  onAddTask: () => void;
  conflicts: Map<string, string[]>;
}

export const AgendaListView: React.FC<AgendaListViewProps> = ({
  items,
  selectedDate,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onToggleSubtask,
  onOpenPomodoro,
  onAddTask,
  conflicts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const dayTasks = items.filter((i) => i.date === selectedDate);

  // Filter tasks
  const filteredTasks = dayTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Group by periods
  const periods = [
    {
      id: 'morning',
      title: 'Pagi Hari (05:00 - 11:59)',
      icon: Sun,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      tasks: filteredTasks.filter((t) => {
        const h = parseInt(t.startTime.split(':')[0], 10);
        return h >= 5 && h < 12;
      }),
    },
    {
      id: 'afternoon',
      title: 'Siang Hari (12:00 - 15:59)',
      icon: Coffee,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      tasks: filteredTasks.filter((t) => {
        const h = parseInt(t.startTime.split(':')[0], 10);
        return h >= 12 && h < 16;
      }),
    },
    {
      id: 'evening',
      title: 'Sore Hari (16:00 - 18:59)',
      icon: Sunset,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      tasks: filteredTasks.filter((t) => {
        const h = parseInt(t.startTime.split(':')[0], 10);
        return h >= 16 && h < 19;
      }),
    },
    {
      id: 'night',
      title: 'Malam Hari (19:00 - 04:59)',
      icon: Moon,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      tasks: filteredTasks.filter((t) => {
        const h = parseInt(t.startTime.split(':')[0], 10);
        return h >= 19 || h < 5;
      }),
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari jadwal atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Prioritas</option>
            <option value="urgent">Mendesak (P1)</option>
            <option value="high">Tinggi (P2)</option>
            <option value="medium">Sedang (P3)</option>
            <option value="low">Rendah (P4)</option>
          </select>
        </div>
      </div>

      {/* Task Groups by Period */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            Tidak ada agenda yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan pencarian filter atau tambahkan agenda baru untuk hari ini.
          </p>
          <button
            onClick={onAddTask}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Sekarang</span>
          </button>
        </div>
      ) : (
        periods.map((period) => {
          if (period.tasks.length === 0) return null;
          const PeriodIcon = period.icon;

          return (
            <div key={period.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`p-1.5 rounded-lg ${period.bg} ${period.color}`}>
                  <PeriodIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {period.title}
                </h3>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {period.tasks.length} Jadwal
                </span>
              </div>

              <div className="space-y-2.5">
                {period.tasks
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';
                    const isConflict = conflicts.has(task.id);
                    const catConfig = getCategoryConfig(task.category);
                    const isExpanded = !!expandedTasks[task.id];

                    return (
                      <div
                        key={task.id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 hover:shadow-md ${
                          isCompleted
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-80'
                            : isInProgress
                            ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800'
                        } ${isConflict ? 'ring-2 ring-red-400' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Checkbox & Details */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => onToggleComplete(task)}
                              title={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                              className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {task.startTime} - {task.endTime}
                                </span>

                                <span
                                  className={`text-2xs font-semibold px-2 py-0.5 rounded-md ${catConfig.bgLight}`}
                                >
                                  {catConfig.name}
                                </span>

                                <span
                                  className={`text-2xs font-semibold px-2 py-0.5 rounded-md border ${
                                    PRIORITY_CONFIG[task.priority].badge
                                  }`}
                                >
                                  {PRIORITY_CONFIG[task.priority].label}
                                </span>

                                {isInProgress && (
                                  <span className="inline-flex items-center gap-1 text-2xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full animate-pulse">
                                    Sedang Berjalan
                                  </span>
                                )}

                                {isConflict && (
                                  <span className="inline-flex items-center gap-1 text-2xs font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                                    <AlertCircle className="w-3 h-3" /> Jam Tabrakan
                                  </span>
                                )}
                              </div>

                              <h4
                                className={`text-sm font-bold ${
                                  isCompleted
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {task.title}
                              </h4>

                              {task.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {task.description}
                                </p>
                              )}

                              {/* Subtasks summary toggle */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => toggleExpand(task.id)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    <span>
                                      {task.subtasks.filter((s) => s.completed).length} dari{' '}
                                      {task.subtasks.length} Subtugas Selesai
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Subtasks checklist */}
                                  {isExpanded && (
                                    <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700 py-1">
                                      {task.subtasks.map((st) => (
                                        <div
                                          key={st.id}
                                          onClick={() => onToggleSubtask(task, st.id)}
                                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-md"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={() => {}}
                                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                          />
                                          <span
                                            className={
                                              st.completed
                                                ? 'line-through text-slate-400'
                                                : ''
                                            }
                                          >
                                            {st.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onOpenPomodoro(task)}
                              title="Fokus Pomodoro"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            >
                              <Timer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onEditTask(task)}
                              title="Edit Agenda"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteTask(task.id)}
                              title="Hapus Agenda"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
