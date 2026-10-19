import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Briefcase,
  GraduationCap,
  TrendingUp,
  HeartPulse,
  Clock,
  Check,
  Plus,
} from 'lucide-react';
import { ROUTINE_TEMPLATES, RoutineTemplate } from '../utils/templates';
import { ScheduleItem } from '../types/schedule';
import { getCategoryConfig, PRIORITY_CONFIG } from '../utils/constants';
import { soundManager } from '../utils/sound';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onApplyTemplate: (items: ScheduleItem[], mode: 'replace' | 'append') => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onApplyTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate>(ROUTINE_TEMPLATES[0]);
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('append');

  if (!isOpen) return null;

  const handleApply = () => {
    const newItems: ScheduleItem[] = selectedTemplate.items.map((item, index) => ({
      ...item,
      id: `tpl-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      date: selectedDate,
      status: 'upcoming',
      subtasks: item.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    soundManager.playSuccess();
    onApplyTemplate(newItems, applyMode);
    onClose();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Templat Rutinitas Jadwal Harian
              </h3>
              <p className="text-xs text-slate-500">
                Pilih struktur jadwal teruji untuk hari {selectedDate}
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
          
          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROUTINE_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {getIcon(tpl.icon)}
                    </div>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {tpl.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                  <span className="inline-block text-2xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                    {tpl.items.length} Blok Agenda
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Template Preview */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pratinjau Jadwal: {selectedTemplate.name}
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedTemplate.items.map((item, idx) => {
                const cat = getCategoryConfig(item.category);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {item.startTime} - {item.endTime}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </span>
                    </div>

                    <span className={`text-2xs px-2 py-0.5 rounded ${cat.bgLight}`}>
                      {cat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode Option */}
          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Opsi Penambahan:
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  value="append"
                  checked={applyMode === 'append'}
                  onChange={() => setApplyMode('append')}
                />
                <span>Tambahkan ke jadwal yang ada</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  value="replace"
                  checked={applyMode === 'replace'}
                  onChange={() => setApplyMode('replace')}
                />
                <span>Gantikan jadwal hari ini</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Terapkan Templat ke Tanggal Ini</span>
          </button>
        </div>

      </div>
    </div>
  );
};
