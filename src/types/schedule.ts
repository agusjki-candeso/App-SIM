export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue';

export type Category = 
  | 'work' 
  | 'study' 
  | 'health' 
  | 'worship' 
  | 'family' 
  | 'personal' 
  | 'entertainment' 
  | 'other';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  category: Category;
  priority: Priority;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: TaskStatus;
  isRecurring?: boolean;
  recurringDays?: number[]; // 0 = Minggu, 1 = Senin, dst.
  subtasks: SubTask[];
  location?: string;
  color?: string;
  completedAt?: string;
  notes?: string;
  reminderMinutes?: number; // Menit sebelum waktu mulai (misal: 10)
  createdAt: string;
  updatedAt: string;
}

export interface DayScheduleSummary {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  completionPercentage: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export interface CategoryConfig {
  id: Category;
  name: string;
  color: string; // Tailwind color or Hex
  bgLight: string;
  border: string;
  icon: string;
}

export interface SyncSettings {
  autoSyncGoogleSheets: boolean;
  sheetsWebhookUrl: string;
  lastSyncedAt?: string;
  autoRolloverTasks: boolean;
  soundEnabled: boolean;
  autoStatusUpdate: boolean;
}
