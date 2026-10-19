import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  MapPin,
  Sparkles,
  Lock,
  Loader2,
  FileDown,
} from 'lucide-react';
import { LessonSchedule, SchoolProfile, Teacher, SchoolClass } from '../types/school';
import { soundManager } from '../utils/sound';
import { printElement, downloadPrintableHtml } from '../utils/printHelper';

interface SchedulesViewProps {
  schedules: LessonSchedule[];
  profile: SchoolProfile;
  teachers: Teacher[];
  classes?: SchoolClass[];
  onSaveSchedule: (schedule: LessonSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onOpenSyncModal: () => void;
  isAdmin?: boolean;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules,
  profile,
  teachers,
  classes = [],
  onSaveSchedule,
  onDeleteSchedule,
  onOpenSyncModal,
  isAdmin = true,
}) => {
  const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];
  const [selectedDay, setSelectedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form Modal for Adding / Editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LessonSchedule | null>(null);

  // Classes list from Google Sheets 'kelas'
  const classesList = React.useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map((c) => c.nama);
    }
    const set = new Set(schedules.map((s) => s.kelas).filter(Boolean));
    return Array.from(set).sort();
  }, [classes, schedules]);

  // Form states
  const [formHari, setFormHari] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [formJamKe, setFormJamKe] = useState<number>(1);
  const [formMulai, setFormMulai] = useState<string>('07:00');
  const [formSelesai, setFormSelesai] = useState<string>('08:30');
  const [formMapel, setFormMapel] = useState<string>('');
  const [formGuru, setFormGuru] = useState<string>(teachers[0]?.nama || profile.kepsek);
  const [formKelas, setFormKelas] = useState<string>(classesList[0] || '10 AKL 1');
  const [formRuang, setFormRuang] = useState<string>('Lab Komputer / Teori');

  const filteredSchedules = schedules.filter((s) => {
    const matchDay = s.hari === selectedDay;
    const matchClass = selectedKelas === 'all' || s.kelas === selectedKelas;
    const matchSearch =
      searchQuery === '' ||
      s.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guruPengampu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ruang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDay && matchClass && matchSearch;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingItem(null);
    setFormHari(selectedDay);
    setFormJamKe(filteredSchedules.length + 1);
    setFormMulai('07:00');
    setFormSelesai('08:30');
    setFormMapel('');
    setFormGuru(teachers[0]?.nama || profile.kepsek);
    setFormKelas(selectedKelas === 'all' ? 'XII RPL 1' : selectedKelas);
    setFormRuang('Ruang Teori 1');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: LessonSchedule) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setFormHari(item.hari);
    setFormJamKe(item.jamKe);
    setFormMulai(item.waktuMulai);
    setFormSelesai(item.waktuSelesai);
    setFormMapel(item.mataPelajaran);
    setFormGuru(item.guruPengampu);
    setFormKelas(item.kelas);
    setFormRuang(item.ruang);
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formMapel.trim()) return;

    const newItem: LessonSchedule = {
      id: editingItem ? editingItem.id : `SCH-${Date.now()}`,
      hari: formHari,
      jamKe: Number(formJamKe),
      waktuMulai: formMulai,
      waktuSelesai: formSelesai,
      mataPelajaran: formMapel.trim(),
      guruPengampu: formGuru.trim(),
      kelas: formKelas,
      ruang: formRuang.trim(),
    };

    onSaveSchedule(newItem);
    soundManager.playSuccess();
    setIsFormOpen(false);
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    soundManager.playSuccess();
    setIsPrinting(true);
    try {
      const title = `Jadwal Pelajaran - ${selectedDay} (${selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas})`;
      await printElement('printable-schedule-area', { title, landscape: false });
    } catch (e) {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadHtml = () => {
    soundManager.playSuccess();
    const title = `Jadwal Pelajaran - ${selectedDay} (${selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas})`;
    const fileName = `Jadwal_${selectedDay}_${(selectedKelas || 'semua').replace(/\s+/g, '_')}.html`;
    downloadPrintableHtml('printable-schedule-area', fileName, title);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Hanya-Lihat Jadwal:</strong> Anda masuk sebagai Guru/GTK. Penataan dan perubahan alokasi jadwal KBM master dikelola terpusat oleh <strong>Administrator & Waka Kurikulum</strong>. Anda dapat melihat serta mencetak jadwal resmi.
            </span>
          </div>
          <span className="text-2xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 shrink-0">
            Akses Guru
          </span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Jadwal Pembelajaran & KBM ({profile.nama_sekolah})
          </h2>
          <p className="text-xs text-slate-500">
            Kelola alokasi jam pelajaran, guru pengampu, dan ruang belajar
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Jadwal KOP Resmi</span>
          </button>
          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sesi Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* Days & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Day Selector Pills */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
          {days.map((day) => {
            const count = schedules.filter((s) => s.hari === day).length;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{day}</span>
                <span className={`text-2xs px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Class Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mapel / guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kelas</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedules Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              Daftar Sesi Hari {selectedDay}
            </span>
            <span className="text-2xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
              {filteredSchedules.length} Pelajaran
            </span>
          </div>
          <span className="text-2xs text-slate-400">
            KBM SMK N 2 Songgom Brebes
          </span>
        </div>

        {filteredSchedules.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSchedules.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-center shrink-0 border border-blue-100 dark:border-blue-900">
                    <span className="text-2xs font-bold block uppercase text-blue-500">Jam Ke</span>
                    <span className="text-lg font-black">{item.jamKe}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.mataPelajaran}
                      </h4>
                      <span className="text-2xs font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {item.kelas}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.waktuMulai} - {item.waktuSelesai} WIB
                      </span>
                      <span>•</span>
                      <span>
                        Guru: <strong className="text-slate-800 dark:text-slate-200">{item.guruPengampu}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.ruang}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus jadwal "${item.mataPelajaran}"?`)) {
                            onDeleteSchedule(item.id);
                            soundManager.playTick();
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-2xs text-slate-400 font-medium px-2 py-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      Sesi KBM
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Belum ada jadwal KBM untuk hari {selectedDay} {selectedKelas !== 'all' ? `kelas ${selectedKelas}` : ''}.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal Sekarang</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT SCHEDULE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Sesi Jadwal Pelajaran' : 'Tambah Sesi Jadwal Pelajaran'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hari:
                  </label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Ke:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formJamKe}
                    onChange={(e) => setFormJamKe(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Mulai:
                  </label>
                  <input
                    type="time"
                    value={formMulai}
                    onChange={(e) => setFormMulai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Selesai:
                  </label>
                  <input
                    type="time"
                    value={formSelesai}
                    onChange={(e) => setFormSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pemrograman Web, Matematika, PKK"
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guru Pengampu:
                </label>
                <select
                  value={formGuru}
                  onChange={(e) => setFormGuru(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.nama}>
                      {t.nama} ({t.mapel})
                    </option>
                  ))}
                  <option value={profile.kepsek}>{profile.kepsek} (Kepala Sekolah)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas:
                  </label>
                  <input
                    type="text"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ruang Belajar / Lab:
                  </label>
                  <input
                    type="text"
                    value={formRuang}
                    onChange={(e) => setFormRuang(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT-READY OFFICIAL SCHEDULE SHEET MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            
            {/* Action buttons at top of preview */}
            <div className="flex items-center justify-between pb-4 border-b print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Cetak Jadwal Resmi KOP {profile.nama_sekolah}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadHtml}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                  title="Unduh file dokumen HTML mandiri siap cetak"
                >
                  <FileDown className="w-4 h-4 text-blue-600" />
                  <span>Unduh Dokumen</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-75"
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuka Dialog Cetak...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Cetak / Simpan PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* THE OFFICIAL KOP SURAT */}
            <div id="printable-schedule-area" className="space-y-6 font-sans">
              <div className="border-b-4 border-double border-slate-900 pb-3 flex items-center gap-4">
                <img
                  src={profile.logo}
                  alt={profile.nama_sekolah}
                  className="w-20 h-20 object-contain shrink-0"
                />
                <div className="text-center flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold tracking-widest uppercase">
                    PEMERINTAH PROVINSI JAWA TENGAH / DINAS PENDIDIKAN & KEBUDAYAAN
                  </h4>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {profile.nama_sekolah}
                  </h2>
                  <p className="text-xs text-slate-700">
                    {profile.alamat}
                  </p>
                  <p className="text-2xs text-slate-600 font-mono">
                    Website: {profile.website} | Email: {profile.email} | NPSN: {profile.npsn}
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold uppercase tracking-wide underline">
                  JADWAL PELAJARAN SEMESTER TAHUN AJARAN 2026/2027
                </h3>
                <p className="text-xs font-semibold text-slate-600">
                  Hari: {selectedDay} | Kelas: {selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas}
                </p>
              </div>

              {/* Official Table */}
              <table className="w-full text-xs border-collapse border border-slate-800">
                <thead className="bg-slate-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="border border-slate-800 p-2 text-center w-12">Jam</th>
                    <th className="border border-slate-800 p-2 text-center w-28">Waktu (WIB)</th>
                    <th className="border border-slate-800 p-2 text-left">Mata Pelajaran</th>
                    <th className="border border-slate-800 p-2 text-left">Guru Pengampu</th>
                    <th className="border border-slate-800 p-2 text-center w-24">Kelas</th>
                    <th className="border border-slate-800 p-2 text-center w-28">Ruang</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((sc) => (
                    <tr key={sc.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-2 text-center font-bold">{sc.jamKe}</td>
                      <td className="border border-slate-800 p-2 text-center font-mono">{sc.waktuMulai} - {sc.waktuSelesai}</td>
                      <td className="border border-slate-800 p-2 font-bold">{sc.mataPelajaran}</td>
                      <td className="border border-slate-800 p-2">{sc.guruPengampu}</td>
                      <td className="border border-slate-800 p-2 text-center font-semibold">{sc.kelas}</td>
                      <td className="border border-slate-800 p-2 text-center">{sc.ruang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Signature Area */}
              <div className="pt-6 flex justify-between text-xs">
                <div className="text-center w-48">
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Waka Kurikulum,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">Siti Nurhaliza, S.Pd.</p>
                  <p className="font-mono text-2xs">NIP. 198511202010012015</p>
                </div>

                <div className="text-center w-64">
                  <p>Songgom, Brebes, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-semibold">Kepala Sekolah {profile.nama_sekolah},</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-2xs text-slate-400 italic">[Tanda Tangan & Stempel Resmi]</span>
                  </div>
                  <p className="font-bold underline">{profile.kepsek}</p>
                  <p className="font-mono text-2xs">NIP. {profile.nip_kepsek}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
