import {
  ExamQuestion,
  ExamSession,
  ExamViolationLog,
  ExamStudentResult,
  ExamOption,
} from '../types/exam';
import {
  parseCsvTo2DArray,
  updateSheetRangeValues,
  appendSheetRow,
} from './googleSheetsApi';

export const SHEET_NAME_BANK_SOAL = 'Ujian_BankSoal';
export const SHEET_NAME_SESI = 'Ujian_Sesi';
export const SHEET_NAME_LOG_PELANGGARAN = 'Ujian_Log_Pelanggaran';
export const SHEET_NAME_HASIL_SISWA = 'Ujian_Jawaban_Siswa';

/**
 * Generate CSV template string for Bank Soal (supporting PG, ESAI, CEKLIST)
 */
export const generateBankSoalCsvTemplate = (sampleSessionId: string = 'SESI_INF_01'): string => {
  const headers = [
    'id_soal',
    'id_sesi',
    'nomor_urut',
    'tipe_soal',
    'pertanyaan',
    'gambar_url',
    'opsi_a',
    'opsi_b',
    'opsi_c',
    'opsi_d',
    'opsi_e',
    'kunci_jawaban',
    'bobot_skor',
  ];

  const sampleRows = [
    [
      'SOAL_001',
      sampleSessionId,
      '1',
      'PG',
      'Berikut ini yang termasuk perangkat keras masukan (input device) komputer adalah...',
      '',
      'Keyboard dan Mouse',
      'Monitor dan Proyektor',
      'Printer dan Speaker',
      'RAM dan Harddisk',
      'Power Supply',
      'A',
      '10',
    ],
    [
      'SOAL_002',
      sampleSessionId,
      '2',
      'CEKLIST',
      'Pilihlah semua jawaban yang BENAR mengenai sistem operasi open source di bawah ini!',
      '',
      'Ubuntu Linux',
      'Microsoft Windows 11',
      'Debian GNU/Linux',
      'macOS Sonoma',
      'Fedora Linux',
      'A,C,E',
      '15',
    ],
    [
      'SOAL_003',
      sampleSessionId,
      '3',
      'ESAI',
      'Jelaskan perbedaan mendasar antara memori RAM dan media penyimpanan SSD/Harddisk dalam arsitektur komputer!',
      '',
      '',
      '',
      '',
      '',
      '',
      'RAM bersifat volatile dan menyimpan data sementara saat sistem menyala, sedangkan SSD/Harddisk bersifat non-volatile untuk penyimpanan permanen.',
      '20',
    ],
    [
      'SOAL_004',
      sampleSessionId,
      '4',
      'CEKLIST',
      'Manakah tindakan di bawah ini yang memicu sistem anti-contek otomatis?',
      '',
      'Membuka tab baru browser',
      'Keluar dari mode layar penuh (fullscreen)',
      'Menekan tombol Alt+Tab',
      'Membaca teks soal dengan teliti',
      'Melakukan klik kanan (Inspect Element)',
      'A,B,C,E',
      '15',
    ],
    [
      'SOAL_005',
      sampleSessionId,
      '5',
      'PG',
      'Protokol jaringan standar yang digunakan untuk mentransfer halaman web secara terenkripsi dan aman adalah...',
      '',
      'FTP',
      'HTTP',
      'HTTPS',
      'SMTP',
      'TELNET',
      'C',
      '10',
    ],
  ];

  const formatRow = (row: string[]) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',');

  return [headers.join(','), ...sampleRows.map(formatRow)].join('\r\n');
};

/**
 * Parses Bank Soal rows from 2D Array / CSV
 */
export const parseBankSoalRows = (rows: any[][]): ExamQuestion[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h || '').toLowerCase().trim());
  const idIdx = headers.findIndex((h) => h.includes('id_soal') || h === 'id');
  const sesiIdx = headers.findIndex((h) => h.includes('sesi') || h.includes('id_sesi'));
  const urutIdx = headers.findIndex((h) => h.includes('urut') || h.includes('nomor'));
  const tipeIdx = headers.findIndex((h) => h.includes('tipe') || h.includes('jenis'));
  const tanyaIdx = headers.findIndex((h) => h.includes('tanya') || h.includes('soal') || h.includes('pertanyaan'));
  const gambarIdx = headers.findIndex((h) => h.includes('gambar') || h.includes('image'));
  const opsiAIdx = headers.findIndex((h) => h.includes('opsi_a') || h === 'a');
  const opsiBIdx = headers.findIndex((h) => h.includes('opsi_b') || h === 'b');
  const opsiCIdx = headers.findIndex((h) => h.includes('opsi_c') || h === 'c');
  const opsiDIdx = headers.findIndex((h) => h.includes('opsi_d') || h === 'd');
  const opsiEIdx = headers.findIndex((h) => h.includes('opsi_e') || h === 'e');
  const kunciIdx = headers.findIndex((h) => h.includes('kunci') || h.includes('jawaban'));
  const bobotIdx = headers.findIndex((h) => h.includes('bobot') || h.includes('skor') || h.includes('nilai'));

  const questions: ExamQuestion[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const rawTanya = tanyaIdx >= 0 && row[tanyaIdx] ? String(row[tanyaIdx]).trim() : '';
    if (!rawTanya) continue;

    let rawTipe = (tipeIdx >= 0 && row[tipeIdx] ? String(row[tipeIdx]).trim().toUpperCase() : 'PG') as any;
    if (rawTipe.includes('CEK') || rawTipe.includes('CHECK') || rawTipe.includes('KOMPLEKS') || rawTipe.includes('MULTI')) {
      rawTipe = 'CEKLIST';
    } else if (rawTipe.includes('ESAI') || rawTipe.includes('ESSAY') || rawTipe.includes('URAIAN')) {
      rawTipe = 'ESAI';
    } else {
      rawTipe = 'PG';
    }

    const options: ExamOption[] = [];
    if (rawTipe !== 'ESAI') {
      const colMap: { key: string; idx: number }[] = [
        { key: 'A', idx: opsiAIdx },
        { key: 'B', idx: opsiBIdx },
        { key: 'C', idx: opsiCIdx },
        { key: 'D', idx: opsiDIdx },
        { key: 'E', idx: opsiEIdx },
      ];

      for (const opt of colMap) {
        if (opt.idx >= 0 && row[opt.idx] && String(row[opt.idx]).trim() !== '') {
          options.push({
            key: opt.key,
            text: String(row[opt.idx]).trim(),
          });
        }
      }
    }

    const rawKunci = kunciIdx >= 0 && row[kunciIdx] ? String(row[kunciIdx]).trim().toUpperCase() : 'A';
    const rawBobot = bobotIdx >= 0 && row[bobotIdx] ? Number(row[bobotIdx]) || 10 : 10;
    const rawOrder = urutIdx >= 0 && row[urutIdx] ? Number(row[urutIdx]) || i : i;
    const rawSesi = sesiIdx >= 0 && row[sesiIdx] ? String(row[sesiIdx]).trim() : 'SESI_DEFAULT';
    const rawId = idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : `SOAL_${Date.now()}_${i}`;
    const rawGambar = gambarIdx >= 0 && row[gambarIdx] ? String(row[gambarIdx]).trim() : undefined;

    questions.push({
      id: rawId,
      sessionId: rawSesi,
      order: rawOrder,
      type: rawTipe,
      question: rawTanya,
      imageUrl: rawGambar || undefined,
      options: options.length > 0 ? options : undefined,
      correctAnswer: rawKunci,
      scoreWeight: rawBobot,
    });
  }

  return questions;
};

/**
 * Convert ExamQuestions to Google Sheets rows
 */
export const questionsToSheetRows = (questions: ExamQuestion[]): any[][] => {
  const headers = [
    'id_soal',
    'id_sesi',
    'nomor_urut',
    'tipe_soal',
    'pertanyaan',
    'gambar_url',
    'opsi_a',
    'opsi_b',
    'opsi_c',
    'opsi_d',
    'opsi_e',
    'kunci_jawaban',
    'bobot_skor',
  ];

  const rows = questions.map((q) => {
    const optMap: Record<string, string> = {};
    if (q.options) {
      q.options.forEach((o) => {
        optMap[o.key] = o.text;
      });
    }

    return [
      q.id,
      q.sessionId,
      q.order,
      q.type,
      q.question,
      q.imageUrl || '',
      optMap['A'] || '',
      optMap['B'] || '',
      optMap['C'] || '',
      optMap['D'] || '',
      optMap['E'] || '',
      q.correctAnswer,
      q.scoreWeight,
    ];
  });

  return [headers, ...rows];
};

/**
 * Convert ExamSessions to Google Sheets rows
 */
export const sessionsToSheetRows = (sessions: ExamSession[]): any[][] => {
  const headers = [
    'id_sesi',
    'judul_ujian',
    'mata_pelajaran',
    'kelas',
    'guru_pengampu',
    'token_ujian',
    'durasi_menit',
    'waktu_mulai',
    'waktu_selesai',
    'acak_soal',
    'acak_opsi',
    'max_pelanggaran',
    'status',
  ];

  const rows = sessions.map((s) => [
    s.id,
    s.title,
    s.subject,
    s.classes.join(', '),
    s.teacher,
    s.token,
    s.durationMinutes,
    s.startTime || '',
    s.endTime || '',
    s.randomizeQuestions ? 'TRUE' : 'FALSE',
    s.randomizeOptions ? 'TRUE' : 'FALSE',
    s.maxViolations,
    s.status,
  ]);

  return [headers, ...rows];
};

/**
 * Record a violation log to Google Sheets in real-time
 */
export const recordViolationToGoogleSheets = async (
  spreadsheetId: string,
  log: ExamViolationLog,
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const row = [
    log.id,
    log.sessionId,
    log.nisn,
    log.studentName,
    log.studentClass,
    log.timestamp,
    log.violationType,
    log.violationCount,
    log.actionTaken,
    log.details || '',
  ];

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordExamViolation',
          spreadsheetId,
          log,
          row,
        }),
      });
    } catch (e) {
      console.warn('Webhook violation log error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, `${SHEET_NAME_LOG_PELANGGARAN}!A:J`, [row], accessToken);
    } catch (e) {
      console.warn('Direct append violation log error', e);
    }
  }

  return true;
};

/**
 * Save exam student result and sync to Google Sheets
 */
export const saveStudentResultToGoogleSheets = async (
  spreadsheetId: string,
  result: ExamStudentResult,
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const row = [
    result.id,
    result.sessionId,
    result.nisn,
    result.studentName,
    result.studentClass,
    result.correctCountPG,
    result.correctCountCeklist,
    result.scoreEssay,
    result.finalScore,
    result.totalViolations,
    result.status,
    result.submittedAt,
    JSON.stringify(result.answers),
  ];

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitExamResult',
          spreadsheetId,
          result,
          row,
        }),
      });
    } catch (e) {
      console.warn('Webhook exam result error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, `${SHEET_NAME_HASIL_SISWA}!A:M`, [row], accessToken);
    } catch (e) {
      console.warn('Direct append exam result error', e);
    }
  }

  return true;
};

/**
 * Generate CSV content for Exam Results with UTF-8 BOM
 */
export const generateExamResultsCsv = (
  session: ExamSession,
  results: ExamStudentResult[],
  schoolName: string = 'SMK NEGERI 2 SONGGOM BREBES'
): string => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate summary stats
  const total = results.length;
  const scores = results.map((r) => r.finalScore);
  const avgScore = total > 0 ? (scores.reduce((a, b) => a + b, 0) / total).toFixed(1) : '0';
  const maxScore = total > 0 ? Math.max(...scores) : 0;
  const minScore = total > 0 ? Math.min(...scores) : 0;
  const tuntasCount = results.filter((r) => r.finalScore >= 75).length;
  const remidialCount = total - tuntasCount;
  const passPercent = total > 0 ? ((tuntasCount / total) * 100).toFixed(1) : '0';

  let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
  csv += `"${schoolName.toUpperCase()} - LAPORAN HASIL ASESMEN UJIAN SEKOLAH (CBT)"\r\n`;
  csv += `"Judul Sesi: ${session.title}"\r\n`;
  csv += `"Mata Pelajaran: ${session.subject}"\r\n`;
  csv += `"Guru Pengampu: ${session.teacher}"\r\n`;
  csv += `"Sasaran Kelas: ${session.classes.join(', ')}"\r\n`;
  csv += `"Token Ujian: ${session.token} | Durasi: ${session.durationMinutes} Menit"\r\n`;
  csv += `"Tanggal Cetak / Ekspor: ${currentDate}"\r\n`;
  csv += `"Standar KKM: 75"\r\n\r\n`;

  // Columns header
  csv += `"No","NISN","Nama Lengkap Siswa","Kelas","Benar PG","Benar Ceklist","Skor Esai","Nilai Akhir","Predikat","Keterangan KKM","Pelanggaran Anti-Contek","Status Ujian","Waktu Selesai"\r\n`;

  results.forEach((r, idx) => {
    let predikat = 'D';
    if (r.finalScore >= 85) predikat = 'A';
    else if (r.finalScore >= 75) predikat = 'B';
    else if (r.finalScore >= 60) predikat = 'C';

    const kkmStatus = r.finalScore >= 75 ? 'TUNTAS' : 'REMEDIAL';
    const submittedTime = r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString('id-ID') : '-';

    csv += `"${idx + 1}","${r.nisn}","${r.studentName.replace(/"/g, '""')}","${r.studentClass}","${r.correctCountPG}","${r.correctCountCeklist}","${r.scoreEssay}","${r.finalScore}","${predikat}","${kkmStatus}","${r.totalViolations}x","${r.status}","${submittedTime}"\r\n`;
  });

  csv += `\r\n`;
  csv += `"RINGKASAN STATISTIK KELAS"\r\n`;
  csv += `"Total Peserta Ujian","${total} Siswa"\r\n`;
  csv += `"Rata-Rata Nilai Kelas","${avgScore}"\r\n`;
  csv += `"Nilai Tertinggi","${maxScore}"\r\n`;
  csv += `"Nilai Terendah","${minScore}"\r\n`;
  csv += `"Jumlah Siswa Tuntas (>= 75)","${tuntasCount} Siswa (${passPercent}%)"\r\n`;
  csv += `"Jumlah Siswa Remedial (< 75)","${remidialCount} Siswa"\r\n`;

  return csv;
};

