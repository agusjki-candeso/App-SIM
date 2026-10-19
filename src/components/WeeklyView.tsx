import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { formatDateIndonesian, getCategoryConfig } from '../utils/constants';

interface WeeklyViewProps {
  items: ScheduleItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAddTaskOnDate: (date: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  items,
  selectedDate,
  onSelectDate,
  onAddTaskOnDate,
}) => {
  // Compute start of week (Monday)
  const current = new Date(selectedDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    return {
      dateStr,
      dayName: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d),
      dayNumber: d.getDate(),
      monthName: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Ikhtisar 7 Hari Mingguan
          </h3>
          <p className="text-xs text-slate-500">
            Klik pada tanggal untuk membuka hari tersebut atau tambah agenda cepat.
          </p>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const dayTasks = items.filter((i) => i.date === day.dateStr);
          const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
          const percentage = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              className={`rounded-3xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[360px] ${
                isSelected
                  ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {day.dayName}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {day.dayNumber}
                  </span>
                  <span className="text-xs text-slate-500">{day.monthName}</span>
                </div>

                {/* Progress Mini Bar */}
                {dayTasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-2xs text-slate-500">
                      <span>{completedCount}/{dayTasks.length} Selesai</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Items */}
              <div className="flex-1 my-2.5 space-y-1.5 overflow-y-auto max-h-[220px] pr-1">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-2xs text-slate-400 text-center py-6">
                    Kosong
                  </div>
                ) : (
                  dayTasks
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((task) => {
                      const cat = getCategoryConfig(task.category);
                      const isCompleted = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          className={`p-1.5 rounded-lg text-2xs border ${
                            isCompleted
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through border-transparent'
                              : `${cat.bgLight} border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-medium`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono">{task.startTime}</span>
                            <span className="truncate flex-1 text-left ml-1">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Add Task on this Day */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTaskOnDate(day.dateStr);
                }}
                className="w-full py-1.5 bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 text-2xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
