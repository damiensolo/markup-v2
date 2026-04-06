import React, { useEffect, useState } from 'react';
import { ChevronRight, Folder, Search } from 'lucide-react';
import { XMarkIcon, DownloadIcon } from './Icons';

export type DownloadFormat = 'PDF' | 'Image';

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFileName: string;
  imageSrc: string | null;
}

const DRIVE_FOLDERS: { id: string; label: string; iconClass: string }[] = [
  { id: 'my', label: 'My Drive', iconClass: 'text-blue-500' },
  { id: 'project', label: 'Project Drive', iconClass: 'text-orange-500' },
];

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.(png|jpg|jpeg|webp|pdf)$/i, '')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .slice(0, 120) || 'export';
}

const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  isOpen,
  onClose,
  defaultFileName,
  imageSrc,
}) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [format, setFormat] = useState<DownloadFormat>('PDF');
  const [folderSearch, setFolderSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName);
      setFormat('PDF');
      setFolderSearch('');
    }
  }, [isOpen, defaultFileName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFolders = DRIVE_FOLDERS.filter((f) =>
    f.label.toLowerCase().includes(folderSearch.trim().toLowerCase())
  );

  const handleDirectDownload = async () => {
    if (!imageSrc) {
      window.alert('No drawing is loaded to export.');
      return;
    }

    const base = sanitizeBaseName(fileName);

    if (format === 'Image') {
      try {
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let ext = 'png';
        if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg';
        else if (blob.type.includes('webp')) ext = 'webp';
        else if (blob.type.includes('png')) ext = 'png';
        a.download = `${base}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        onClose();
      } catch {
        const a = document.createElement('a');
        a.href = imageSrc;
        a.download = `${base}.png`;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        onClose();
      }
      return;
    }

    // PDF: open print-friendly view (user can Save as PDF from the print dialog)
    const w = window.open('', '_blank');
    if (!w) {
      window.alert('Allow pop-ups to export as PDF, or choose Image download.');
      return;
    }
    const safeTitle = base.replace(/</g, '');
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${safeTitle}</title></head><body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f4f4f5"><img src="${imageSrc.replace(/"/g, '&quot;')}" alt="" style="max-width:100%;max-height:100vh;object-fit:contain" onload="window.focus();window.print()"/></body></html>`
    );
    w.document.close();
    onClose();
  };

  return (
    <div className="linarc-modal-overlay" onClick={onClose}>
      <div
        className="linarc-modal-panel max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-options-title"
      >
        <div className="linarc-modal-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="download-options-title" className="linarc-modal-title">
                Download Snapshot
              </h3>
              <p className="linarc-modal-subtitle">Export your current view and data</p>
            </div>
            <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="linarc-modal-body space-y-5 !pt-2">
          <div>
            <label htmlFor="download-file-name" className="linarc-field-label">
              File name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="download-file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="linarc-input min-w-0 flex-1"
                placeholder="Drawing_markup"
              />
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as DownloadFormat)}
                className="linarc-select w-full shrink-0 sm:w-[7.5rem]"
                aria-label="Export format"
              >
                <option value="PDF">PDF</option>
                <option value="Image">Image</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectDownload}
            disabled={!imageSrc}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            <DownloadIcon className="h-5 w-5 shrink-0 text-white" />
            Direct Download
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-gray-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:bg-zinc-900 dark:text-zinc-500">
                Or save to drive
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="search"
              placeholder="Search folders…"
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              className="linarc-input pl-9"
              aria-label="Search folders"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700">
            {filteredFolders.map((f) => (
              <button
                key={f.id}
                type="button"
                className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm font-medium text-gray-800 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
              >
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                <Folder className={`h-4 w-4 shrink-0 ${f.iconClass}`} />
                {f.label}
              </button>
            ))}
            {filteredFolders.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-zinc-500">No folders match</p>
            )}
          </div>
        </div>

        <div className="linarc-modal-footer">
          <button type="button" onClick={onClose} className="linarc-btn-modal-cancel">
            Cancel
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-700 dark:text-zinc-400"
            title="Connect a drive to enable this action"
          >
            Save to Drive
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptionsModal;
