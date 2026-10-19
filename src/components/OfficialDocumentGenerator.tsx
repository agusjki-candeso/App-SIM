import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Download,
  Building2,
  CheckCircle,
  QrCode,
  ShieldCheck,
  UserCheck,
  FileDown,
  Loader2,
} from 'lucide-react';
import { SchoolProfile, Student, Teacher } from '../types/school';
import { soundManager } from '../utils/sound';
import { printElement, downloadPrintableHtml } from '../utils/printHelper';

interface OfficialDocumentGeneratorProps {
  profile: SchoolProfile;
  students: Student[];
  teachers: Teacher[];
}

export const OfficialDocumentGenerator: React.FC<OfficialDocumentGeneratorProps> = ({
  profile,
  students,
  teachers,
}) => {
  const [docType, setDocType] = useState<'surat_aktif' | 'surat_tugas' | 'kartu_pelajar'>('surat_aktif');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [nomorSurat, setNomorSurat] = useState(`421.5/082/SMKN2-SGM/${new Date().getFullYear()}`);
  const [keperluan, setKeperluan] = useState('Pengajuan Beasiswa Pendidikan & Pembukaan Rekening Bank');
  const [namaKegiatan, setNamaKegiatan] = useState('Pelatihan Implementasi Kurikulum Merdeka & Vokasi Industri');
  const [tempatTugas, setTempatTugas] = useState('Dinas Pendidikan & Kebudayaan Wilayah XI Prov. Jawa Tengah');
  const [isPrinting, setIsPrinting] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handlePrint = async () => {
    soundManager.playSuccess();
    setIsPrinting(true);
    try {
      const title = docType === 'surat_aktif'
        ? `Surat Keterangan Aktif - ${selectedStudent?.nama}`
        : docType === 'surat_tugas'
        ? `Surat Tugas - ${selectedTeacher?.nama}`
        : `Kartu Pelajar - ${selectedStudent?.nama}`;
      await printElement('printable-document-area', { title, landscape: false });
    } catch (e) {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadHtml = () => {
    soundManager.playSuccess();
    const title = docType === 'surat_aktif'
      ? `Surat Keterangan Aktif - ${selectedStudent?.nama}`
      : docType === 'surat_tugas'
      ? `Surat Tugas - ${selectedTeacher?.nama}`
      : `Kartu Pelajar - ${selectedStudent?.nama}`;
    const fileName = `${docType}_${(selectedStudent?.nama || selectedTeacher?.nama || 'dokumen').replace(/\s+/g, '_')}.html`;
    downloadPrintableHtml('printable-document-area', fileName, title);
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generator Dokumen & Surat KOP Resmi ({profile.nama_sekolah})
          </h2>
          <p className="text-xs text-slate-500">
            Cetak surat dinas, surat keterangan siswa, surat tugas guru, dan kartu pelajar ber-KOP resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadHtml}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            title="Download file dokumen HTML mandiri"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>Unduh Dokumen</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-75"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuka Dialog Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Panel (Selector) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Jenis Dokumen Resmi:
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
          >
            <option value="surat_aktif">1. Surat Keterangan Siswa Aktif</option>
            <option value="surat_tugas">2. Surat Tugas Dinas Guru (GTK)</option>
            <option value="kartu_pelajar">3. Kartu Tanda Pelajar SMK</option>
          </select>
        </div>

        {docType === 'surat_aktif' && (
          <>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Siswa:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nama} ({st.kelas} - {st.nisn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Keperluan Surat:
              </label>
              <input
                type="text"
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </>
        )}

        {docType === 'surat_tugas' && (
          <>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Guru / GTK:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} ({t.mapel})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kegiatan & Lokasi:
              </label>
              <input
                type="text"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </>
        )}

        {docType === 'kartu_pelajar' && (
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa untuk Kartu:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nama} ({st.kelas} - {st.nisn})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW PAPER (A4 Look) */}
      <div id="printable-document-area" className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-300 max-w-4xl mx-auto space-y-6 font-serif">
        
        {/* OFFICIAL KOP SURAT SMK NEGERI 2 SONGGOM */}
        <div className="border-b-4 border-double border-slate-900 pb-3 flex items-center gap-5">
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            <img
              src={profile.logo}
              alt={profile.nama_sekolah}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center flex-1 space-y-0.5 font-sans">
            <h4 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-900 uppercase">
              PEMERINTAH PROVINSI JAWA TENGAH
            </h4>
            <h4 className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h4>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {profile.nama_sekolah}
            </h2>
            <p className="text-xs text-slate-700">
              {profile.alamat}
            </p>
            <p className="text-2xs text-slate-600 font-mono">
              Website: {profile.website} | Email: {profile.email} | Telp: {profile.telepon}
            </p>
          </div>
        </div>

        {/* 1. SURAT KETERANGAN AKTIF */}
        {docType === 'surat_aktif' && selectedStudent && (
          <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-sans">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold tracking-wide uppercase underline">
                SURAT KETERANGAN SISWA AKTIF
              </h3>
              <p className="text-xs font-mono">Nomor: {nomorSurat}</p>
            </div>

            <p>
              Yang bertanda tangan di bawah ini, Kepala {profile.nama_sekolah} Kabupaten Brebes, dengan ini menerangkan bahwa:
            </p>

            <div className="pl-6 space-y-1.5 font-medium">
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Nama Lengkap</span>
                <span className="col-span-2 font-bold">: {selectedStudent.nama}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">NISN / NIS</span>
                <span className="col-span-2 font-mono">: {selectedStudent.nisn} / {selectedStudent.nis}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Kelas / Rombel</span>
                <span className="col-span-2">: {selectedStudent.kelas}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Program Keahlian</span>
                <span className="col-span-2">: {selectedStudent.jurusan}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Alamat Domisili</span>
                <span className="col-span-2">: {selectedStudent.alamat}</span>
              </div>
            </div>

            <p>
              Adalah benar-benar peserta didik aktif yang terdaftar dan mengikuti Kegiatan Belajar Mengajar (KBM) pada {profile.nama_sekolah} pada Tahun Ajaran 2026/2027.
            </p>

            <p>
              Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: <strong className="underline">{keperluan}</strong>.
            </p>

            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
            </p>

            {/* Signature Area */}
            <div className="pt-8 flex justify-end">
              <div className="text-center w-72 space-y-1">
                <p>Songgom, Brebes, {currentDateFormatted}</p>
                <p className="font-bold">Kepala Sekolah,</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="w-16 h-16 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-3xs text-slate-400">
                    [Stempel Resmi]
                  </div>
                </div>
                <p className="font-extrabold underline text-sm">{profile.kepsek}</p>
                <p className="font-mono text-xs">NIP. {profile.nip_kepsek}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. SURAT TUGAS GURU */}
        {docType === 'surat_tugas' && selectedTeacher && (
          <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-sans">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold tracking-wide uppercase underline">
                SURAT PERINTAH TUGAS
              </h3>
              <p className="text-xs font-mono">Nomor: {nomorSurat}</p>
            </div>

            <p>
              Kepala {profile.nama_sekolah} Kabupaten Brebes, dengan ini menugaskan kepada:
            </p>

            <div className="pl-6 space-y-1.5 font-medium">
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Nama Lengkap</span>
                <span className="col-span-2 font-bold">: {selectedTeacher.nama}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">NIP / NUPTK</span>
                <span className="col-span-2 font-mono">: {selectedTeacher.nip}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Pangkat / Golongan / Status</span>
                <span className="col-span-2">: {selectedTeacher.status}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Jabatan</span>
                <span className="col-span-2">: {selectedTeacher.jabatan}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-600">Mata Pelajaran</span>
                <span className="col-span-2">: {selectedTeacher.mapel}</span>
              </div>
            </div>

            <p>
              Untuk melaksanakan tugas dinas dalam rangka: <strong className="underline">{namaKegiatan}</strong>.
            </p>

            <p>
              Demikian surat tugas ini diberikan untuk dapat dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya setelah selesai kegiatan.
            </p>

            {/* Signature Area */}
            <div className="pt-8 flex justify-end">
              <div className="text-center w-72 space-y-1">
                <p>Songgom, Brebes, {currentDateFormatted}</p>
                <p className="font-bold">Kepala Sekolah,</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="w-16 h-16 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-3xs text-slate-400">
                    [Stempel Resmi]
                  </div>
                </div>
                <p className="font-extrabold underline text-sm">{profile.kepsek}</p>
                <p className="font-mono text-xs">NIP. {profile.nip_kepsek}</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. KARTU PELAJAR (ID CARD) */}
        {docType === 'kartu_pelajar' && selectedStudent && (
          <div className="font-sans flex items-center justify-center py-6">
            <div className="w-96 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-linear-to-b from-blue-900 to-indigo-950 text-white p-5 space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center gap-3 border-b border-blue-700/60 pb-3">
                <img
                  src={profile.logo}
                  alt={profile.nama_sekolah}
                  className="w-12 h-12 object-contain bg-white p-1 rounded-xl"
                />
                <div>
                  <h4 className="text-2xs font-extrabold tracking-wider text-amber-300 uppercase">
                    KARTU TANDA PELAJAR
                  </h4>
                  <h3 className="text-xs font-black uppercase text-white">
                    {profile.nama_sekolah}
                  </h3>
                  <p className="text-3xs text-blue-200">Songgom, Kabupaten Brebes</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex gap-4">
                <div className="w-24 h-28 bg-white/10 rounded-xl border border-white/20 flex flex-col items-center justify-center text-2xs text-blue-200 text-center p-1 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 mb-1 flex items-center justify-center font-bold text-white text-sm">
                    {selectedStudent.nama.charAt(0)}
                  </div>
                  <span>FOTO 3x4</span>
                </div>

                <div className="space-y-1 text-2xs flex-1">
                  <div>
                    <span className="text-blue-300 block text-3xs">NAMA LENGKAP:</span>
                    <strong className="text-white text-xs">{selectedStudent.nama}</strong>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-3xs">NISN / NIS:</span>
                    <span className="font-mono text-amber-300 font-bold">{selectedStudent.nisn} / {selectedStudent.nis}</span>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-3xs">KELAS / JURUSAN:</span>
                    <span className="text-white">{selectedStudent.kelas} ({selectedStudent.jurusan})</span>
                  </div>
                  <div>
                    <span className="text-blue-300 block text-3xs">ALAMAT:</span>
                    <span className="text-blue-100 text-3xs line-clamp-1">{selectedStudent.alamat}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Headmaster */}
              <div className="pt-2 border-t border-blue-800 flex items-center justify-between text-3xs text-blue-200">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Valid Th. Ajaran 2026/2027</span>
                </div>
                <div className="text-right">
                  <span>Kepsek: <strong>{profile.kepsek}</strong></span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
