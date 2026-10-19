export interface SchoolProfile {
  id: string;
  logo: string;
  nama_sekolah: string;
  alamat: string;
  kepsek: string;
  nip_kepsek: string;
  guru: string;
  nip_guru: string;
  npsn?: string;
  akreditasi?: string;
  email?: string;
  telepon?: string;
  website?: string;
}

export interface SchoolClass {
  id: string;
  nama: string;
  tingkat?: string;
  jurusan?: string;
}

export interface Teacher {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  jabatan: string;
  email?: string;
  telepon?: string;
  status: 'PNS' | 'PPPK' | 'GTT' | 'Honor';
  fotoUrl?: string;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  jenisKelamin: 'L' | 'P';
  alamat?: string;
  teleponOrtu?: string;
  status: 'Aktif' | 'Mutasi' | 'Lulus' | 'Non-Aktif';
}

export interface LessonSchedule {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamKe: number;
  waktuMulai: string;
  waktuSelesai: string;
  mataPelajaran: string;
  guruPengampu: string;
  nipGuru?: string;
  kelas: string;
  ruang: string;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  mataPelajaran: string;
  tp?: string;
  jenis?: string;
  nilaiTugas: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiPraktikUKK: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
}

export interface StudentAttendance {
  id: string;
  tanggal: string;
  nis: string;
  namaSiswa?: string;
  kelas?: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Dispensasi';
  ket?: string;
}

export interface TeachingJournal {
  id: string;
  tanggal: string;
  kelas: string;
  mapel: string;
  tp: string;
  deskripsi: string;
  guru: string;
}

export interface OfficialLetter {
  nomorSurat: string;
  jenisSurat: 'Surat Keterangan Aktif' | 'Surat Tugas Guru' | 'Surat Dispensasi' | 'Surat Panggilan Ortu' | 'Kartu Pelajar';
  perihal: string;
  tanggalSurat: string;
  namaPenerima: string;
  identitasPenerima: string;
  keterangan: string;
  tujuan: string;
}
