# Perancangan Struktur Database Google Sheets & Sistem Ujian Sekolah Anti-Contek (CBT Anti-Cheat)

Rancangan arsitektur sistem ujian berbasis komputer (CBT) anti-contek terintegrasi Google Sheets untuk SMK Negeri 2 Songgom, mendukung soal **Pilihan Ganda (PG)**, **Esai**, dan **Ceklist (Pilihan Ganda Kompleks / Multi-Select)** dengan deteksi kecurangan otomatis dan perekaman log audit secara *real-time*.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Utama yang Telah Dikonfirmasi**:
> - **Format Soal Terverifikasi**: Pilihan Ganda (PG tunggal), Esai (jawaban uraian teks), dan Ceklist (pilihan ganda kompleks/multi-jawaban benar).
> - **Integrasi Database**: Menggunakan Google Sheets sebagai *master database* dua arah (Bank Soal, Peserta & Token, Log Pelanggaran, dan Hasil/Nilai Ujian) yang kompatibel dengan alur autentikasi Google dan Apps Script yang sudah ada di aplikasi.
> - **Protokol Anti-Contek (Client-Side Shield)**:
>   1. Wajib Layar Penuh (*Fullscreen Lockdown API*).
>   2. Deteksi keluar aplikasi/ganti tab (*VisibilityChange & Window Blur Detection*).
>   3. Blokir fungsi klik kanan (*Context Menu*), blokir *Copy-Paste*, dan blokir tombol pintas inspeksi (*F12, Ctrl+Shift+I, Alt+Tab*).
>   4. Batas maksimal pelanggaran (misal: 3x peringatan) yang jika terlampaui akan otomatis mengunci lembar ujian (*auto-lock*) atau mendiskualifikasi ujian secara otomatis.

---

## 1. Overview & Core Concept

- **Apa yang Dihadirkan**: Modul Ujian Sekolah Digital (CBT Anti-Cheat) yang disematkan langsung ke dalam ekosistem sistem informasi sekolah. Guru dapat mengelola bank soal (PG, Esai, Ceklist) di Google Sheets atau formulir interaktif, mengatur jadwal dan token sesi, memantau peserta ujian secara langsung (*live proctoring*), sementara siswa mengerjakan ujian dalam mode *Anti-Cheat Shield*.
- **Target Pengguna**:
  - **Guru & Pengawas**: Mengunggah soal ke spreadsheet, mengaktifkan sesi, merilis token, serta mengawasi peringatan pelanggaran siswa secara *real-time*.
  - **Siswa**: Mengerjakan ujian dengan antarmuka yang bersih, navigasi nomor soal yang responsif, timer hitung mundur, dan peringatan anti-curang jika mencoba keluar layar.
  - **Admin / Kepala Sekolah**: Melihat rekapitulasi nilai yang langsung masuk ke Google Sheets tanpa perlu input manual berulang.
- **Nilai Utama**: Menghilangkan celah contek saat ujian daring atau ujian di lab sekolah tanpa memerlukan instalasi aplikasi native rumit (Safe Exam Browser), cukup menggunakan browser modern dengan sinkronisasi instan ke Google Sheets.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Alur Guru / Pembuat Soal**:
   - Membuka tab navigasi **Ujian Sekolah (CBT)** di aplikasi.
   - Memilih mata pelajaran, kelas sasaran, durasi ujian, tanggal tayang, dan generate token ujian acak (misal: `MTK-8821`).
   - Mengisi bank soal (tipe: PG, Esai, Ceklist) atau menekan tombol **"Download Template Google Sheets"** / **"Sync Bank Soal dari Spreadsheet"**.
   - Menetapkan aturan anti-contek (toleransi keluar tab: 1-5 kali, acak urutan soal, acak opsi jawaban).

2. **Alur Siswa (Student Exam Room)**:
   - Siswa login menggunakan NISN/NIS yang telah terdaftar di database siswa.
   - Siswa memasukkan Token Ujian yang diberikan pengawas di ruangan.
   - Muncul instruksi integritas dan tombol **"Masuk Mode Layar Penuh & Mulai Ujian"**.
   - Antarmuka ujian terbuka penuh (*fullscreen*). Siswa menjawab soal dengan 3 tipe:
     - **Pilihan Ganda**: Memilih 1 radio button opsi (A, B, C, D, E).
     - **Ceklist**: Memilih beberapa kotak centang yang benar (misal: pilihan 1, 3, dan 4 benar).
     - **Esai**: Mengetikkan jawaban pada editor teks dengan indikator jumlah kata.
   - Jika siswa mencoba *Alt+Tab*, ganti tab browser, membuka DevTools, atau keluar dari fullscreen:
     - Layar menampilkan *modal peringatan darurat* berwarna amber/red yang membekukan waktu ujian.
     - Jumlah pelanggaran bertambah (*Strike Counter*).
     - Pelanggaran langsung dicatat ke Log Google Sheets.
     - Jika melebihi kuota batas (misal 3 kali), ujian otomatis dikunci dan jawaban terkirim (*force submitted*).
   - Setelah selesai, siswa menekan tombol "Kirim Jawaban & Selesaikan Ujian" dengan konfirmasi ganda.

3. **Alur Pengawas & Koreksi (Monitoring & Scoring)**:
   - Guru membuka dashboard monitoring untuk melihat status ujian setiap siswa: status aktif, sisa waktu, jumlah pelanggaran, dan nilai sementara (otomatis terkoreksi untuk PG & Ceklist).
   - Guru dapat mengoreksi esai secara langsung atau mengekspor nilai akhir ke sheet **Nilai**.

### Visual Identity & Theme (Mengikuti Design Constitution)
- **Palette & Mood**:
  - Background kanvas: Netral berwibawa `#F8FAFC` (Slate-50) pada mode terang atau `#0F172A` (Slate-900) pada mode gelap.
  - Aksen Utama: Sapphire Blue `#2563EB` untuk navigasi ujian dan nomor soal aktif.
  - Semantic Status Pelanggaran: Coral Crimson `#DC2626` dan Amber `#D97706` dengan label teks eksplisit (`▲ PERINGATAN: KELUAR DARI HALAMAN UJIAN`).
  - Permukaan soal: Kartu putih bersih dengan garis batas hairline halus (`border border-slate-200`).
- **Tipografi**:
  - Header & Nomor Soal: `Plus Jakarta Sans` semi-bold.
  - Teks Soal & Opsi: `DM Sans` / `Plus Jakarta Sans` dengan ukuran 16px dan line-height 1.6 untuk kenyamanan membaca dalam durasi panjang.
  - Timer Ujian & Angka: `font-mono tabular-nums` agar hitung mundur tidak goyang.
- **Zero-Pill Discipline**:
  - Metadata ujian (Waktu tersisa, Nomor Soal, Bobot Nilai) disajikan dengan pemisah tipografi bersih (`·` atau `/`), bukan badge kapsul bertumpuk.

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Struktur Spreadsheet Google Sheets
- **Pendekatan Terpilih**: Format Multi-Sheet Terstandarisasi dalam spreadsheet sekolah yang sudah ada, menambahkan 4 sheet khusus:
  1. `Ujian_BankSoal`: Menyimpan butir-butir soal, tipe (PG, ESAI, CEKLIST), opsi jawaban, kunci jawaban, dan pembahasan.
  2. `Ujian_Sesi`: Mengatur sesi ujian, mata pelajaran, durasi menit, token masuk, kelas, dan toleransi pelanggaran.
  3. `Ujian_Jawaban_Siswa`: Menyimpan log jawaban siswa per butir soal dan status koreksi.
  4. `Ujian_Log_Pelanggaran`: Mencatat rekam jejak pelanggaran siswa (waktu, jenis kecurangan: *Blur*, *Fullscreen Exit*, *Shortcut Key*, *Device Switch*).
- **Alasan**: Menjaga integritas data tanpa membebani satu tabel raksasa, mudah dibaca dan diedit langsung oleh guru di Google Sheets atau formulir web, serta memudahkan pembuatan template kosong.
- **Alternatif yang Dipertimbangkan**: Menyimpan soal dalam satu kolom JSON di sheet nilai; ditolak karena sulit diedit secara manual oleh guru yang terbiasa menggunakan spreadsheet.

### Keputusan 2: Penilaian Otomatis Soal Ceklist (Multi-Select)
- **Pendekatan Terpilih**: Kunci jawaban ceklist disimpan dalam format terpisah tanda koma (contoh: `A,C,D`). Sistem menerapkan skor proporsional (atau skor penuh jika semua benar dan tidak ada salah pilih) untuk menghargai pemahaman parsial siswa.
- **Alasan**: Mencegah siswa menebak semua pilihan dan memberikan penilaian yang adil sesuai kaidah asesmen Kurikulum Merdeka / Asesmen Nasional.

### Keputusan 3: Penanganan Koneksi & Ketahanan Data (Offline Resilience)
- **Pendekatan Terpilih**: Setiap perubahan jawaban siswa langsung disimpan secara lokal di `localStorage` per butir soal, lalu disinkronkan secara asinkron (*debounced auto-save*) ke sistem Google Sheets / server.
- **Alasan**: Menghindari hilangnya jawaban siswa jika terjadi pemadaman listrik sesaat atau koneksi internet sekolah melambat di tengah ujian.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANTARMUKA APLIKASI (REACT)                      │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │   Guru / Pengawas     │             │    Siswa / Peserta Ujian   │  │
│  │  - Bank Soal Manager  │             │  - Fullscreen Shield       │  │
│  │  - Token Generator    │             │  - Anti-Cheat Watchdog     │  │
│  │  - Live Proctor Board │             │  - PG/Esai/Ceklist Engine  │  │
│  └───────────┬───────────┘             └─────────────┬──────────────┘  │
│              │                                       │                 │
│              ▼                                       ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               STATE MANAGER & LOCAL STORAGE CACHE                │  │
│  │   - ujianStorage.ts (Sesi, Lembar Jawab, Event Pelanggaran)     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ (OAuth v4 / Apps Script Webhook)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   GOOGLE SHEETS DATABASE STRUCTURE                     │
│                                                                        │
│  1. [Ujian_BankSoal]       : id, mapel, tipe, pertanyaan, opsi_a...    │
│  2. [Ujian_Sesi]           : id, judul, kelas, token, durasi, status   │
│  3. [Ujian_Jawaban_Siswa]  : id, id_sesi, nisn, jawaban_json, skor    │
│  4. [Ujian_Log_Pelanggaran]: id, id_sesi, nisn, jenis, waktu, ket      │
│  5. [Nilai] (Sinkron)      : Rekap nilai akhir masuk ke rapor sekolah  │
└────────────────────────────────────────────────────────────────────────┘
```

### Rincian Struktur Kolom Database Google Sheets

#### Sheet 1: `Ujian_BankSoal` (GID Spesifik / Sheet "Ujian_BankSoal")
| Kolom | Nama Header | Tipe Data | Contoh Isi | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| A | `id_soal` | Teks | `SOAL_INF_001` | ID Unik butir soal |
| B | `id_sesi` | Teks | `SESI_PAS_2026_01` | Terhubung ke sesi ujian |
| C | `nomor_urut` | Angka | `1` | Nomor urut tampilan default |
| D | `tipe_soal` | Teks | `PG`, `ESAI`, `CEKLIST` | Tipe soal yang dipilih user |
| E | `pertanyaan` | Teks | `Manakah yang termasuk komponen hardware komputer?` | Teks soal utama |
| F | `gambar_url` | Teks | `https://...` (opsional) | URL gambar penunjang soal jika ada |
| G | `opsi_a` | Teks | `RAM` | Pilihan A (untuk PG & Ceklist) |
| H | `opsi_b` | Teks | `Keyboard` | Pilihan B |
| I | `opsi_c` | Teks | `Microsoft Excel` | Pilihan C |
| J | `opsi_d` | Teks | `Monitor` | Pilihan D |
| K | `opsi_e` | Teks | `Linux Kernel` | Pilihan E (opsional) |
| L | `kunci_jawaban`| Teks | `A` (untuk PG), `A,B,D` (untuk Ceklist), `kata kunci` (untuk Esai) | Kunci jawaban sistem |
| M | `bobot_skor` | Angka | `2.5` | Bobot nilai per butir |

#### Sheet 2: `Ujian_Sesi` (Daftar Pelaksanaan Ujian)
| Kolom | Nama Header | Tipe Data | Contoh Isi |
| :--- | :--- | :--- | :--- |
| A | `id_sesi` | Teks | `SESI_PAS_2026_01` |
| B | `judul_ujian` | Teks | `Asesmen Akhir Semester - Informatika` |
| C | `mata_pelajaran` | Teks | `Informatika` |
| D | `kelas` | Teks | `10 AKL 1, 10 DPIB 1, 10 NKPI 1` |
| E | `guru_pengampu`| Teks | `Agus Joko Iryanto, S.Kom` |
| F | `token_ujian` | Teks | `INF-9281` (6 karakter aman) |
| G | `durasi_menit` | Angka | `90` |
| H | `waktu_mulai` | Tanggal/Waktu | `2026-10-20 07:30:00` |
| I | `waktu_selesai`| Tanggal/Waktu | `2026-10-20 09:30:00` |
| J | `acak_soal` | Teks | `TRUE` / `FALSE` |
| K | `acak_opsi` | Teks | `TRUE` / `FALSE` |
| L | `max_pelanggaran`| Angka | `3` (Otomatis kunci jika 3x curang) |
| M | `status` | Teks | `Draft`, `Aktif`, `Selesai` |

#### Sheet 3: `Ujian_Log_Pelanggaran` (Anti-Cheat Audit Trail)
| Kolom | Nama Header | Tipe Data | Contoh Isi | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| A | `id_log` | Teks | `LOG_PEL_1729051821_01` | ID Unik log |
| B | `id_sesi` | Teks | `SESI_PAS_2026_01` | ID Sesi |
| C | `nisn` | Teks | `00600001` | NISN Siswa |
| D | `nama_siswa` | Teks | `Ahmad Rizky` | Nama Siswa |
| E | `kelas` | Teks | `10 AKL 1` | Kelas Siswa |
| F | `waktu_kejadian`| Waktu ISO | `2026-10-20T08:14:22` | Timestamp persis |
| G | `jenis_pelanggaran`| Teks | `GANTI_TAB`, `KELUAR_FULLSCREEN`, `COPY_PASTE`, `SHORTCUT_TERLARANG` | Kategori |
| H | `pelanggaran_ke`| Angka | `1`, `2`, `3` | Peringatan ke berapa |
| I | `tindakan` | Teks | `Peringatan Layar`, `Auto-Submit & Kunci Akun` | Hasil aksi sistem |

#### Sheet 4: `Ujian_Jawaban_Siswa` (Rekap Hasil & Lembar Jawaban)
| Kolom | Nama Header | Tipe Data | Contoh Isi |
| :--- | :--- | :--- | :--- |
| A | `id_hasil` | Teks | `RES_SESI01_00600001` |
| B | `id_sesi` | Teks | `SESI_PAS_2026_01` |
| C | `nisn` | Teks | `00600001` |
| D | `nama_siswa` | Teks | `Ahmad Rizky` |
| E | `kelas` | Teks | `10 AKL 1` |
| F | `total_benar_pg`| Angka | `25` |
| G | `total_benar_ceklist`| Angka | `8` |
| H | `skor_esai` | Angka | `15` (dapat dikoreksi guru) |
| I | `nilai_akhir` | Angka | `88.5` |
| J | `total_pelanggaran`| Angka | `1` |
| K | `status_pengerjaan`| Teks | `Selesai`, `Didiskualifikasi`, `Waktu Habis` |
| L | `waktu_submit` | Waktu ISO | `2026-10-20T08:55:10` |
| M | `detail_jawaban`| JSON String| `{"SOAL_01": "A", "SOAL_02": ["A","C"], "SOAL_03": "Uraian..."}` |

---

## 5. Komponen & Fitur Aplikasi yang Akan Dibangun

1. **`ExamManagementView.tsx` (Panel Guru & Bank Soal)**:
   - Manajemen sesi ujian baru (input judul, pilih kelas, set durasi, token acak).
   - Pembuat soal visual interaktif dengan pemilih tipe:
     - Tab **Pilihan Ganda** (Opsi A–E, radio button kunci jawaban).
     - Tab **Esai** (Panduan rubrik penilaian, batas kata).
     - Tab **Ceklist** (Opsi kotak centang multi-pilih dengan penetapan beberapa kunci jawaban benar).
   - Export & Import template CSV/Spreadsheet Google Sheets dengan 1 klik.
   - Papan Pengawas Langsung (*Live Proctoring Monitor*).

2. **`ExamAntiCheatRoom.tsx` (Ruang Ujian Siswa)**:
   - Validasi token sesi dan identitas siswa.
   - Aktivasi *Fullscreen Shield* browser.
   - Watchdog listeners:
     - `document.addEventListener('visibilitychange')`: Deteksi siswa beralih jendela/aplikasi.
     - `window.addEventListener('blur')`: Deteksi kehilangan fokus layar.
     - `document.addEventListener('fullscreenchange')`: Deteksi keluar dari mode layar penuh.
     - `document.addEventListener('contextmenu')` & `keydown` (F12, Ctrl+C, Ctrl+V, Alt+Tab, Windows Key) yang dicegah via `e.preventDefault()`.
   - Bilah navigasi butir soal (warna: hijau untuk sudah dijawab, kuning untuk ragu-ragu, abu-abu untuk belum dijawab).
   - Timer hitung mundur interaktif dengan peringatan saat sisa 5 menit.
   - Modal Peringatan Pelanggaran Otomatis.

3. **`GoogleSheetsExamSync.ts`**:
   - Fungsi pembaca dan pembuat sheet otomatis (`Ujian_BankSoal`, `Ujian_Sesi`, `Ujian_Log_Pelanggaran`, `Ujian_Jawaban_Siswa`).
   - Ekspor otomatis nilai ujian ke Sheet `Nilai` utama sekolah yang sudah ada agar terintegrasi dengan rapor siswa.

---

## 6. Verifikasi & Pengujian

1. **Verifikasi Tipe Soal**:
   - Memastikan soal PG menyimpan 1 pilihan string.
   - Memastikan soal Ceklist menyimpan array pilihan (misal `["A", "C"]`) dan dievaluasi dengan benar terhadap kunci jawaban.
   - Memastikan soal Esai menyimpan teks panjang dan dapat diberi nilai oleh guru.
2. **Uji Coba Skenario Anti-Contek**:
   - Mensimulasikan siswa menekan `Alt+Tab` atau membuka tab baru: sistem harus memicu peringatan seketika, mencatat timestamp ke log, dan menambah penghitung pelanggaran.
   - Menguji saat batas pelanggaran tercapai (3x): ujian wajib terkunci otomatis dan jawaban tersimpan.
3. **Uji Sinkronisasi Google Sheets**:
   - Menguji ekspor dan impor format CSV / API Google Sheets untuk memastikan semua data tersusun rapi sesuai kolom tabel yang dirancang.
