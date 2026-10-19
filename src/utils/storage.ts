import { ScheduleItem, SyncSettings, Category, Priority, TaskStatus } from '../types/schedule';
import { INITIAL_SCHEDULE_ITEMS, DEFAULT_SYNC_SETTINGS, getTodayDateString } from './constants';

const STORAGE_KEY = 'jadwalsync_items_v2';
const SETTINGS_KEY = 'jadwalsync_settings_v2';

export const loadScheduleItems = (): ScheduleItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = INITIAL_SCHEDULE_ITEMS();
      saveScheduleItems(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SCHEDULE_ITEMS();
  } catch (err) {
    console.error('Error loading schedule from storage:', err);
    return INITIAL_SCHEDULE_ITEMS();
  }
};

export const saveScheduleItems = (items: ScheduleItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving schedule to storage:', err);
  }
};

export const loadSettings = (): SyncSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SYNC_SETTINGS;
    return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYNC_SETTINGS;
  }
};

export const saveSettings = (settings: SyncSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
};

// Auto status updater according to real current time
export const updateTasksAutoStatus = (items: ScheduleItem[], currentDateStr: string): { updated: ScheduleItem[]; changed: boolean } => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  let hasChanged = false;

  const updated = items.map((item) => {
    // Only auto-update tasks for today or past days
    if (item.date !== currentDateStr) {
      return item;
    }

    if (item.status === 'completed') {
      return item;
    }

    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    let newStatus: TaskStatus = item.status;

    if (currentTotalMinutes >= startTotal && currentTotalMinutes < endTotal) {
      if (item.status !== 'in_progress') {
        newStatus = 'in_progress';
        hasChanged = true;
      }
    } else if (currentTotalMinutes >= endTotal) {
      if (item.status !== 'overdue') {
        newStatus = 'overdue';
        hasChanged = true;
      }
    } else if (currentTotalMinutes < startTotal) {
      if (item.status !== 'upcoming') {
        newStatus = 'upcoming';
        hasChanged = true;
      }
    }

    if (newStatus !== item.status) {
      return {
        ...item,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    }

    return item;
  });

  return { updated, changed: hasChanged };
};

// Check for conflicting overlapping schedules
export const findScheduleConflicts = (items: ScheduleItem[], dateStr: string): Map<string, string[]> => {
  const dayItems = items.filter((i) => i.date === dateStr);
  const conflicts = new Map<string, string[]>();

  for (let i = 0; i < dayItems.length; i++) {
    for (let j = i + 1; j < dayItems.length; j++) {
      const a = dayItems[i];
      const b = dayItems[j];

      const aStart = toMinutes(a.startTime);
      const aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);

      // Overlap condition
      if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
        const aList = conflicts.get(a.id) || [];
        aList.push(b.title);
        conflicts.set(a.id, aList);

        const bList = conflicts.get(b.id) || [];
        bList.push(a.title);
        conflicts.set(b.id, bList);
      }
    }
  }

  return conflicts;
};

const toMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Roll over unfinished tasks from yesterday to today
export const rolloverUnfinishedTasks = (items: ScheduleItem[], targetDate: string): { items: ScheduleItem[]; count: number } => {
  const today = targetDate || getTodayDateString();
  const pastUnfinished = items.filter(
    (item) => item.date < today && (item.status === 'overdue' || item.status === 'upcoming')
  );

  if (pastUnfinished.length === 0) {
    return { items, count: 0 };
  }

  const newItems: ScheduleItem[] = pastUnfinished.map((old) => ({
    ...old,
    id: `rollover-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    date: today,
    status: 'upcoming',
    notes: (old.notes ? old.notes + ' | ' : '') + `(Dipindahkan dari ${old.date})`,
    updatedAt: new Date().toISOString(),
  }));

  // Mark original items as moved/closed
  const updatedOriginals = items.map((i) => {
    if (pastUnfinished.some((p) => p.id === i.id)) {
      return { ...i, notes: (i.notes ? i.notes + ' | ' : '') + `[Ditunda ke ${today}]` };
    }
    return i;
  });

  const merged = [...updatedOriginals, ...newItems];
  saveScheduleItems(merged);
  return { items: merged, count: newItems.length };
};

// ==========================================
// GOOGLE SHEETS & EXCEL EXPORT / IMPORT TOOLS
// ==========================================

// Format TSV (Tab Separated Values) for 100% perfect direct paste into Google Sheets / Excel
export const generateGoogleSheetsTSV = (items: ScheduleItem[]): string => {
  const headers = ['Tanggal', 'Waktu Mulai', 'Waktu Selesai', 'Judul Jadwal', 'Kategori', 'Prioritas', 'Status', 'Catatan / Subtugas'];
  const rows = items.map((item) => {
    const subtaskStr = item.subtasks && item.subtasks.length > 0 
      ? item.subtasks.map(s => `${s.completed ? '✓' : '○'} ${s.title}`).join('; ')
      : '';
    const noteText = [item.description, item.notes, subtaskStr ? `[Subtugas: ${subtaskStr}]` : '']
      .filter(Boolean)
      .join(' - ')
      .replace(/[\t\n\r]+/g, ' ');

    return [
      item.date,
      item.startTime,
      item.endTime,
      item.title.replace(/[\t\n\r]+/g, ' '),
      item.category,
      item.priority,
      item.status,
      noteText,
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
};

// Format standard CSV
export const generateCSV = (items: ScheduleItem[]): string => {
  const headers = ['Tanggal', 'Waktu Mulai', 'Waktu Selesai', 'Judul Jadwal', 'Kategori', 'Prioritas', 'Status', 'Catatan'];
  const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = items.map((item) => {
    return [
      escapeCsv(item.date),
      escapeCsv(item.startTime),
      escapeCsv(item.endTime),
      escapeCsv(item.title),
      escapeCsv(item.category),
      escapeCsv(item.priority),
      escapeCsv(item.status),
      escapeCsv(item.description || item.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// Parse CSV or TSV pasted or loaded from Google Sheets
export const parseGoogleSheetsData = (rawText: string, defaultDate?: string): { success: boolean; items: ScheduleItem[]; error?: string } => {
  try {
    const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return { success: false, items: [], error: 'Data kosong. Silakan paste data jadwal dari Google Sheets.' };
    }

    const isTSV = lines[0].includes('\t');
    const delimiter = isTSV ? '\t' : ',';

    const parsedItems: ScheduleItem[] = [];
    const startIndex = (lines[0].toLowerCase().includes('tanggal') || lines[0].toLowerCase().includes('judul') || lines[0].toLowerCase().includes('waktu')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let cols: string[] = [];

      if (delimiter === '\t') {
        cols = line.split('\t').map(s => s.trim());
      } else {
        // Simple CSV splitter handling quotes
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        let match;
        cols = [];
        while ((match = regex.exec(line)) !== null) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          cols.push(val.trim());
          if (regex.lastIndex === line.length) break;
        }
      }

      if (cols.length < 2) continue;

      let date = defaultDate || getTodayDateString();
      let startTime = '08:00';
      let endTime = '09:00';
      let title = 'Jadwal Baru';
      let category: Category = 'work';
      let priority: Priority = 'medium';
      let status: TaskStatus = 'upcoming';
      let notes = '';

      // Pattern 1: [Tanggal, WaktuMulai, WaktuSelesai, Judul, Kategori, Prioritas, Status, Catatan]
      if (cols[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = cols[0];
        startTime = cols[1] || '08:00';
        endTime = cols[2] || '09:00';
        title = cols[3] || 'Jadwal Baru';
        category = mapCategory(cols[4]);
        priority = mapPriority(cols[5]);
        status = mapStatus(cols[6]);
        notes = cols[7] || '';
      } 
      // Pattern 2: [WaktuMulai, WaktuSelesai, Judul, Kategori]
      else if (cols[0].match(/^\d{1,2}:\d{2}$/)) {
        startTime = cols[0];
        endTime = cols[1] || addOneHour(startTime);
        title = cols[2] || 'Jadwal Baru';
        category = mapCategory(cols[3]);
        priority = mapPriority(cols[4]);
        notes = cols[5] || '';
      }
      // Pattern 3: [Judul, WaktuMulai, WaktuSelesai]
      else {
        title = cols[0] || 'Jadwal';
        startTime = cols[1]?.match(/^\d{1,2}:\d{2}$/) ? cols[1] : '09:00';
        endTime = cols[2]?.match(/^\d{1,2}:\d{2}$/) ? cols[2] : addOneHour(startTime);
        category = mapCategory(cols[3]);
      }

      // Ensure 2-digit format for HH:mm
      startTime = normalizeTime(startTime);
      endTime = normalizeTime(endTime);

      parsedItems.push({
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        description: notes,
        category,
        priority,
        date,
        startTime,
        endTime,
        status,
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (parsedItems.length === 0) {
      return { success: false, items: [], error: 'Format kolom tidak dikenali. Pastikan terdapat kolom Waktu dan Judul.' };
    }

    return { success: true, items: parsedItems };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kesalahan saat memproses data';
    return { success: false, items: [], error: message };
  }
};

const normalizeTime = (t: string): string => {
  if (!t) return '09:00';
  const parts = t.split(':');
  if (parts.length < 2) return '09:00';
  const h = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  return `${h}:${m}`;
};

const addOneHour = (timeStr: string): string => {
  const [h, m] = timeStr.split(':').map(Number);
  const newH = (h + 1) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
};

const mapCategory = (raw?: string): Category => {
  if (!raw) return 'work';
  const r = raw.toLowerCase();
  if (r.includes('kerja') || r.includes('work') || r.includes('proyek') || r.includes('kantor')) return 'work';
  if (r.includes('ajar') || r.includes('study') || r.includes('kuliah') || r.includes('buku')) return 'study';
  if (r.includes('sehat') || r.includes('olahraga') || r.includes('health') || r.includes('gym')) return 'health';
  if (r.includes('ibadah') || r.includes('sholat') || r.includes('doa') || r.includes('spiritual')) return 'worship';
  if (r.includes('keluarga') || r.includes('family') || r.includes('anak') || r.includes('teman')) return 'family';
  if (r.includes('hibur') || r.includes('game') || r.includes('nonton') || r.includes('hobby')) return 'entertainment';
  if (r.includes('pribadi') || r.includes('makan') || r.includes('tidur') || r.includes('santai')) return 'personal';
  return 'other';
};

const mapPriority = (raw?: string): Priority => {
  if (!raw) return 'medium';
  const r = raw.toLowerCase();
  if (r.includes('urgent') || r.includes('mendesak') || r.includes('p1')) return 'urgent';
  if (r.includes('high') || r.includes('tinggi') || r.includes('p2')) return 'high';
  if (r.includes('low') || r.includes('rendah') || r.includes('p4')) return 'low';
  return 'medium';
};

const mapStatus = (raw?: string): TaskStatus => {
  if (!raw) return 'upcoming';
  const r = raw.toLowerCase();
  if (r.includes('selesai') || r.includes('done') || r.includes('complete') || r.includes('✓')) return 'completed';
  if (r.includes('jalan') || r.includes('progress') || r.includes('sedang')) return 'in_progress';
  if (r.includes('lewat') || r.includes('overdue') || r.includes('tunda')) return 'overdue';
  return 'upcoming';
};

// Webhook auto-sync with Google Apps Script
export const syncWithGoogleSheetsWebhook = async (webhookUrl: string, items: ScheduleItem[]): Promise<{ success: boolean; message: string; remoteItems?: ScheduleItem[] }> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Apps Script belum valid.' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'sync',
        source: 'JadwalSync-Web',
        timestamp: new Date().toISOString(),
        items: items,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Sinkronisasi dengan Google Sheets berhasil!',
      remoteItems: Array.isArray(data.items) ? data.items : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke Webhook gagal';
    return { success: false, message: `Gagal sinkronisasi: ${msg}` };
  }
};
