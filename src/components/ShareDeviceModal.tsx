import React, { useState } from 'react';
import {
  X,
  Share2,
  QrCode,
  Copy,
  Check,
  Download,
  Upload,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ScheduleItem } from '../types/schedule';
import { soundManager } from '../utils/sound';

interface ShareDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  onImportBackup: (items: ScheduleItem[]) => void;
}

export const ShareDeviceModal: React.FC<ShareDeviceModalProps> = ({
  isOpen,
  onClose,
  items,
  onImportBackup,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [backupText, setBackupText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate Base64 Sync Code
  const getSyncCode = () => {
    try {
      const json = JSON.stringify(items);
      return btoa(unescape(encodeURIComponent(json)));
    } catch {
      return JSON.stringify(items);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSyncCode());
    setCopiedCode(true);
    soundManager.playSuccess();
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jadwalsync-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    soundManager.playSuccess();
  };

  const handleRestoreBackup = () => {
    if (!backupText.trim()) {
      setImportStatus('Harap masukkan kode sync atau JSON backup.');
      return;
    }

    try {
      let parsed: ScheduleItem[];
      try {
        const decoded = decodeURIComponent(escape(atob(backupText.trim())));
        parsed = JSON.parse(decoded);
      } catch {
        parsed = JSON.parse(backupText.trim());
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        onImportBackup(parsed);
        soundManager.playSuccess();
        setImportStatus(`Berhasil memulihkan ${parsed.length} jadwal!`);
        setTimeout(() => onClose(), 1500);
      } else {
        setImportStatus('Data tidak valid atau kosong.');
      }
    } catch (err) {
      setImportStatus('Format kode salah atau rusak.');
    }
  };

  // QR Code generator URL using public image API
  const syncCode = getSyncCode();
  // Limit QR code size for URL safety
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    window.location.href
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Akses di Semua Perangkat (HP / Laptop)
              </h3>
              <p className="text-xs text-slate-500">
                Pindahkan dan buka jadwal Anda di smartphone atau komputer lain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Method 1: QR Code */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="bg-white p-2.5 rounded-2xl border shadow-xs shrink-0">
              <img
                src={qrUrl}
                alt="QR Code URL Jadwal"
                className="w-28 h-28 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Scan dengan Kamera HP</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Buka kamera smartphone Anda dan arahkan ke QR Code di samping untuk langsung membuka aplikasi di browser HP.
              </p>
            </div>
          </div>

          {/* Method 2: One-click Sync Code */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Kode Sinkronisasi Cepat (Instan)
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-blue-200" />
                    <span>Kode Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode Sync Seluruh Jadwal</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadJSON}
                title="Unduh Backup File JSON"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          </div>

          {/* Method 3: Restore/Paste code on other device */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Masukkan Kode / Pulihkan di Perangkat Ini:
            </label>
            <textarea
              rows={3}
              placeholder="Tempel kode sinkronisasi yang disalin dari perangkat lain di sini..."
              value={backupText}
              onChange={(e) => setBackupText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            ></textarea>

            <button
              onClick={handleRestoreBackup}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan & Terapkan Jadwal</span>
            </button>

            {importStatus && (
              <p className="text-xs font-bold text-center text-blue-600 dark:text-blue-400 mt-1">
                {importStatus}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
