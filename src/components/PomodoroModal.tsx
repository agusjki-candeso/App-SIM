import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Timer,
  Coffee,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScheduleItem } from '../types/schedule';
import { soundManager } from '../utils/sound';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ScheduleItem | null;
  onCompleteTask: (task: ScheduleItem) => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  onClose,
  task,
  onCompleteTask,
}) => {
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  useEffect(() => {
    if (mode === 'focus') {
      setTimeLeft(durationMinutes * 60);
    } else if (mode === 'short_break') {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(15 * 60);
    }
    setIsRunning(false);
  }, [mode, durationMinutes, task]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundManager.playAlarm();
      if (mode === 'focus') {
        setSessionsCompleted((prev) => prev + 1);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  if (!isOpen || !task) return null;

  const toggleStart = () => {
    soundManager.playTick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'focus') setTimeLeft(durationMinutes * 60);
    else if (mode === 'short_break') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  const handleMarkTaskComplete = () => {
    soundManager.playSuccess();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    onCompleteTask(task);
    onClose();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = mode === 'focus' ? durationMinutes * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col p-6 text-center relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Task Header */}
        <div className="mt-2 space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Timer className="w-3.5 h-3.5" />
            MODE FOKUS TERPADU
          </span>
          <h3 className="text-lg font-extrabold text-white line-clamp-1 mt-1">
            {task.title}
          </h3>
          <p className="text-xs text-slate-400">
            {task.startTime} - {task.endTime}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mt-5 inline-flex p-1 bg-slate-800/80 rounded-2xl border border-slate-700 mx-auto">
          <button
            onClick={() => setMode('focus')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              mode === 'focus' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fokus
          </button>
          <button
            onClick={() => setMode('short_break')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              mode === 'short_break' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Jeda Pendek (5m)
          </button>
          <button
            onClick={() => setMode('long_break')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              mode === 'long_break' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Jeda Panjang (15m)
          </button>
        </div>

        {/* Focus Duration Selection */}
        {mode === 'focus' && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {[15, 25, 45, 50].map((mins) => (
              <button
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`px-2.5 py-1 text-2xs font-bold rounded-lg border transition-colors ${
                  durationMinutes === mins
                    ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {mins} Menit
              </button>
            ))}
          </div>
        )}

        {/* Circular / Large Timer Display */}
        <div className="my-6 relative flex items-center justify-center">
          <div className="w-56 h-56 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950/40 shadow-inner">
            {/* Progress Fill Background */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-indigo-600/20 transition-all duration-1000"
              style={{ height: `${progressPercent}%` }}
            ></div>

            <div className="relative z-10">
              <span className="text-5xl font-mono font-extrabold tracking-tight text-white drop-shadow-md">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <p className="text-2xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {mode === 'focus' ? 'Sesi Produktif' : 'Waktu Istirahat'}
              </p>
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            title="Reset Timer"
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleStart}
            className={`px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Mulai Fokus</span>
              </>
            )}
          </button>

          <button
            onClick={handleMarkTaskComplete}
            title="Tandai Jadwal Selesai"
            className="p-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl border border-emerald-500/30 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions Completed count */}
        {sessionsCompleted > 0 && (
          <div className="mt-4 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4" />
            <span>{sessionsCompleted} sesi fokus selesai hari ini!</span>
          </div>
        )}

      </div>
    </div>
  );
};
