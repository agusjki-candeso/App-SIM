/**
 * Universal Print & PDF Helper
 * Ensures 100% reliable printing in standalone browsers, iframes, mobile devices, and desktop environments.
 */

export interface PrintOptions {
  title?: string;
  landscape?: boolean;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Prints an HTML element using an isolated hidden iframe with all active stylesheets.
 * This guarantees the print dialog opens correctly even inside iframe sandboxes and preview runners.
 */
export const printElement = (
  target: string | HTMLElement,
  options: PrintOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      let element: HTMLElement | null = null;
      if (typeof target === 'string') {
        element = document.getElementById(target);
      } else {
        element = target;
      }

      if (!element) {
        console.warn('Print target element not found, falling back to window.print()');
        window.print();
        resolve(true);
        return;
      }

      if (options.onBeforePrint) {
        options.onBeforePrint();
      }

      // Collect all stylesheets and style blocks from current document
      let stylesHtml = '';
      const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleElements.forEach((el) => {
        stylesHtml += el.outerHTML + '\n';
      });

      // Prepare custom print styling
      const customPrintStyles = `
        <style>
          @page {
            size: A4 ${options.landscape ? 'landscape' : 'portrait'};
            margin: 8mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .no-print, .print-hidden {
            display: none !important;
          }
          .printable-content {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #000000 !important;
          }
        </style>
      `;

      // Create hidden iframe for printing
      const iframeId = `print-frame-${Date.now()}`;
      const existingFrame = document.getElementById(iframeId);
      if (existingFrame) {
        existingFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.name = iframeId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        throw new Error('Unable to access iframe document');
      }

      const docTitle = options.title || 'Dokumen Resmi - SMK Negeri 2 Songgom';

      // Build standalone printable document
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${docTitle}</title>
          ${stylesHtml}
          ${customPrintStyles}
        </head>
        <body>
          <div class="printable-content">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      const triggerPrint = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            window.print();
          }

          if (options.onAfterPrint) {
            options.onAfterPrint();
          }

          // Clean up iframe after print dialog finishes
          setTimeout(() => {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            resolve(true);
          }, 2000);
        } catch (err) {
          console.warn('Iframe print failed, fallback to window.print():', err);
          window.print();
          if (options.onAfterPrint) {
            options.onAfterPrint();
          }
          resolve(true);
        }
      };

      // Wait for iframe and any images (like school logo) to load
      if (iframe.contentWindow) {
        iframe.onload = () => {
          setTimeout(triggerPrint, 350);
        };
        // Fallback timer in case onload doesn't fire
        setTimeout(triggerPrint, 600);
      } else {
        setTimeout(triggerPrint, 400);
      }
    } catch (e) {
      console.error('Error executing printElement:', e);
      window.print();
      resolve(false);
    }
  });
};

/**
 * Downloads the printable element as a standalone, styled HTML document
 * that can be opened in any browser or converted to PDF.
 */
export const downloadPrintableHtml = (
  elementId: string,
  fileName: string = 'dokumen_presensi.html',
  title: string = 'Dokumen Resmi'
) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  let stylesHtml = '';
  const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
  styleElements.forEach((el) => {
    stylesHtml += el.outerHTML + '\n';
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${stylesHtml}
  <style>
    @page { size: A4 portrait; margin: 10mm 15mm; }
    body { background: #f8fafc; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
    .page-sheet { background: white; max-width: 800px; margin: 0 auto; padding: 30px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
    @media print {
      body { background: white !important; padding: 0 !important; }
      .page-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar max-w-[800px] mx-auto mb-4 flex items-center justify-between bg-blue-900 text-white p-3 rounded-xl">
    <span class="text-xs font-bold">${title}</span>
    <button onclick="window.print()" style="background:#2563eb; color:white; padding:6px 16px; border-radius:8px; font-size:12px; font-weight:bold; border:none; cursor:pointer;">
      Cetak / Simpan PDF
    </button>
  </div>
  <div class="page-sheet">
    ${element.innerHTML}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
