import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, X, Palette, FileText } from 'lucide-react';
import type { PdfStyle } from '../lib/exportPdf';

interface ExportPdfProps {
  onExport: (style: PdfStyle) => void;
}

export function ExportPdfButton({ onExport }: ExportPdfProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport(style: PdfStyle) {
    setExporting(true);
    // Small delay so spinner renders before heavy PDF generation blocks the thread
    await new Promise((r) => setTimeout(r, 50));
    try {
      onExport(style);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg bg-transparent cursor-pointer shrink-0 flex items-center gap-1"
        style={{
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
          fontSize: '13px',
        }}
        aria-label="Export to PDF"
      >
        <FileDown size={14} />
      </button>
    );
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={() => !exporting && setOpen(false)}
      />

      {/* Modal */}
      <div
        className="fixed z-50 left-1/2 top-[58%] sm:top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] sm:max-h-none overflow-y-auto sm:overflow-visible rounded-2xl p-6 flex flex-col gap-5 animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, #1c1b25 0%, #16151d 100%)',
          border: '1px solid var(--accent-border)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(201,168,76,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-base m-0"
            style={{ fontFamily: 'var(--heading)', color: 'var(--accent)', fontSize: '1rem' }}
          >
            Export Character
          </h2>
          <button
            onClick={() => !exporting && setOpen(false)}
            className="bg-transparent border-none cursor-pointer p-1"
            style={{ color: 'var(--text)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm m-0" style={{ color: 'var(--text)', lineHeight: '1.5' }}>
          Export your character sheet as a printable PDF. Choose a style:
        </p>

        {/* Style options */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleExport('color')}
            disabled={exporting}
            className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(99,102,241,0.08))',
              border: '1px solid var(--accent-border)',
              textAlign: 'left',
            }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
            >
              <Palette size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div
                className="font-semibold text-sm"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
              >
                Dark Fantasy
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                Rich dark background with gold accents, colored spell &amp; HP sections.
                Best for digital viewing or color printers.
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExport('bw')}
            disabled={exporting}
            className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              textAlign: 'left',
            }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <FileText size={20} style={{ color: 'var(--text)' }} />
            </div>
            <div>
              <div
                className="font-semibold text-sm"
                style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)', letterSpacing: '0.3px' }}
              >
                Print-Friendly
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                Clean black-and-white layout on white paper. Saves ink, easy to read and annotate.
              </div>
            </div>
          </button>
        </div>

        {/* Exporting spinner */}
        {exporting && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div
              className="w-5 h-5 rounded-full"
              style={{
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation: 'diceRoll 0.8s linear infinite',
              }}
            />
            <span className="text-sm" style={{ color: 'var(--accent)', fontFamily: 'var(--heading)' }}>
              Generating PDF…
            </span>
          </div>
        )}
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
