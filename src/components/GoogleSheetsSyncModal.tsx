import React, { useState } from 'react';
import {
  X,
  Table,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Code2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ScheduleItem, SyncSettings } from '../types/schedule';
import {
  generateGoogleSheetsTSV,
  generateCSV,
  parseGoogleSheetsData,
  syncWithGoogleSheetsWebhook,
} from '../utils/storage';
import { soundManager } from '../utils/sound';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  onImportItems: (newItems: ScheduleItem[], mode: 'append' | 'replace') => void;
  syncSettings: SyncSettings;
  onUpdateSettings: (settings: SyncSettings) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  onImportItems,
  syncSettings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'copy' | 'import' | 'webhook'>('copy');
  const [copied, setCopied] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [importPreview, setImportPreview] = useState<ScheduleItem[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [webhookUrl, setWebhookUrl] = useState(syncSettings.sheetsWebhookUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState(false);

  if (!isOpen) return null;

  // Direct TSV copy for 1-click paste to Google Sheets
  const handleCopyForSheets = () => {
    const tsvData = generateGoogleSheetsTSV(items);
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    soundManager.playSuccess();
    setTimeout(() => setCopied(false), 3000);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csvContent = generateCSV(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jadwal-sync-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundManager.playSuccess();
  };

  // Parse pasted Google Sheets text
  const handleParsePastedData = () => {
    setImportError(null);
    if (!pasteData.trim()) {
      setImportError('Silakan tempel (paste) data dari Google Sheets terlebih dahulu.');
      return;
    }

    const result = parseGoogleSheetsData(pasteData);
    if (result.success && result.items.length > 0) {
      setImportPreview(result.items);
      soundManager.playSuccess();
    } else {
      setImportError(result.error || 'Format tidak valid. Pastikan data memiliki kolom waktu dan judul.');
    }
  };

  // Upload file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPasteData(text);
        const result = parseGoogleSheetsData(text);
        if (result.success && result.items.length > 0) {
          setImportPreview(result.items);
          soundManager.playSuccess();
        } else {
          setImportError(result.error || 'Format file CSV/TSV tidak sesuai.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importPreview && importPreview.length > 0) {
      onImportItems(importPreview, importMode);
      soundManager.playSuccess();
      onClose();
    }
  };

  // Webhook Test Sync
  const handleTestSync = async () => {
    if (!webhookUrl) {
      setSyncStatus({ success: false, message: 'Harap masukkan URL Webhook Google Apps Script.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    
    // Save settings first
    onUpdateSettings({
      ...syncSettings,
      sheetsWebhookUrl: webhookUrl,
      lastSyncedAt: new Date().toISOString(),
    });

    const res = await syncWithGoogleSheetsWebhook(webhookUrl, items);
    setIsSyncing(false);
    setSyncStatus(res);

    if (res.success) {
      soundManager.playSuccess();
      if (res.remoteItems && res.remoteItems.length > 0) {
        onImportItems(res.remoteItems, 'replace');
      }
    }
  };

  const appsScriptTemplate = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tulis header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal", "Waktu Mulai", "Waktu Selesai", "Judul Jadwal", "Kategori", "Prioritas", "Status", "Catatan"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e2e8f0");
    }
    
    // Tulis data jadwal
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function(item) {
        sheet.appendRow([item.date, item.startTime, item.endTime, item.title, item.category, item.priority, item.status, item.description || ""]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sinkronisasi berhasil dicatat di Google Sheets!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Integrasi & Sinkronisasi Google Sheets / Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses, ekspor, dan edit jadwal harian di perangkat manapun
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50 dark:bg-slate-800/40">
          <button
            onClick={() => setActiveTab('copy')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'copy'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin ke Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor dari Sheets / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkron Otomatis (Webhook)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: COPY FOR GOOGLE SHEETS */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl text-emerald-950 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Salin 1-Klik Langsung ke Google Spreadsheet</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Cukup tekan tombol di bawah, lalu buka Google Sheets (atau Excel) baru di laptop/HP Anda dan tekan <strong>Ctrl + V</strong> (Paste). Data akan otomatis tersusun rapi dengan kolom Tanggal, Jam, Judul, Kategori, Prioritas & Status.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCopyForSheets}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Berhasil Disalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Tabel Format Google Sheets ({items.length} Jadwal)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File CSV</span>
                </button>
              </div>

              {/* Preview Format Table */}
              <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Pratinjau Format Kolom Spreadsheet:
                </div>
                <div className="overflow-x-auto max-h-48 p-2 bg-slate-50 dark:bg-slate-900/60 font-mono text-2xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-1.5">Tanggal</th>
                        <th className="p-1.5">Mulai</th>
                        <th className="p-1.5">Selesai</th>
                        <th className="p-1.5">Judul</th>
                        <th className="p-1.5">Kategori</th>
                        <th className="p-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 4).map((i) => (
                        <tr key={i.id} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-1.5 text-slate-600 dark:text-slate-300">{i.date}</td>
                          <td className="p-1.5 text-slate-600 dark:text-slate-300">{i.startTime}</td>
                          <td className="p-1.5 text-slate-600 dark:text-slate-300">{i.endTime}</td>
                          <td className="p-1.5 text-slate-900 dark:text-white font-bold">{i.title}</td>
                          <td className="p-1.5 text-slate-600 dark:text-slate-300">{i.category}</td>
                          <td className="p-1.5 text-slate-600 dark:text-slate-300">{i.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT FROM GOOGLE SHEETS */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Salin baris jadwal dari Google Sheets Anda lalu tempel (Paste) di kotak berikut, atau upload file CSV:
              </p>

              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Tempel data yang disalin dari Google Sheets di sini (Ctrl + V)..."
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                ></textarea>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File CSV</span>
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleParsePastedData}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Periksa & Pratinjau Data
                  </button>
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-red-500/10 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Preview */}
              {importPreview && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      ✓ Ditemukan {importPreview.length} Jadwal Valid
                    </span>

                    <div className="flex items-center gap-2 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                        />
                        <span>Gabungkan</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                        />
                        <span>Gantikan Semua</span>
                      </label>
                    </div>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                    {importPreview.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-mono text-2xs text-slate-500">
                          {item.date} ({item.startTime} - {item.endTime})
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Simpan dan Terapkan ke Jadwal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBHOOK SYNC */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-300 dark:border-blue-800 rounded-2xl text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>Sinkronisasi Otomatis Google Apps Script</span>
                </div>
                <p className="text-blue-800 dark:text-blue-300">
                  Hubungkan Google Sheets Anda langsung melalui Webhook Apps Script untuk mengirim data secara real-time dari perangkat manapun tanpa perlu login akun.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  URL Webhook Google Apps Script
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={handleTestSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
                  </button>
                </div>
              </div>

              {syncStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-300 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-500/10 border border-red-300 text-red-800 dark:text-red-200'
                  }`}
                >
                  {syncStatus.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* Instructions Accordion */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <button
                  onClick={() => setShowScriptCode(!showScriptCode)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    Panduan 1 Menit & Kode Apps Script
                  </span>
                  <span>{showScriptCode ? 'Tutup Kode' : 'Lihat Kode'}</span>
                </button>

                {showScriptCode && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                    <ol className="list-decimal list-inside space-y-1 text-2xs">
                      <li>Buka Spreadsheet di <strong>sheets.new</strong></li>
                      <li>Klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong></li>
                      <li>Hapus kode bawaan dan tempel kode di bawah ini:</li>
                    </ol>

                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-2xs font-mono">
                      {appsScriptTemplate}
                    </pre>

                    <ol start={4} className="list-decimal list-inside space-y-1 text-2xs">
                      <li>Klik <strong>Deploy (Terapkan) &gt; New Deployment</strong></li>
                      <li>Pilih Type: <strong>Web app</strong>, Who has access: <strong>Anyone (Siapa saja)</strong></li>
                      <li>Salin Web App URL dan tempelkan ke kolom input di atas!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
