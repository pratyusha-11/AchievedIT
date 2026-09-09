import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Calendar,
  Tag,
  Trophy,
  Building2,
  Globe,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { Certificate, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';
import { getCertificatePreviewUrl } from '../lib/pdfHelper';

interface CertificateViewModalProps {
  cert: Certificate | null;
  onClose: () => void;
  onEdit?: (cert: Certificate) => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CertificateViewModal({
  cert,
  onClose,
  onEdit
}: CertificateViewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'image' | 'pdf'>('image');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (cert) {
      window.addEventListener('keydown', handleKeyDown);
      setZoom(1);
      setViewMode('image');
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cert, onClose]);

  if (!cert) return null;

  const isPdf =
    cert.fileKind === 'pdf' ||
    cert.fileUrl.toLowerCase().endsWith('.pdf') ||
    cert.fileUrl.includes('.pdf?') ||
    cert.fileUrl.includes('/pdf/') ||
    (cert.rawFileUrl && cert.rawFileUrl.toLowerCase().endsWith('.pdf'));

  // Get reliable page 1 JPEG preview URL
  const previewImageUrl = getCertificatePreviewUrl(cert);
  const rawDocumentUrl = cert.rawFileUrl || cert.fileUrl;
  const downloadUrl = cert.pdfDownloadUrl || rawDocumentUrl;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!downloadUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      const cleanTitle = (cert.title || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = isPdf ? 'pdf' : (downloadUrl.split('.').pop()?.split(/[?#]/)[0] || 'jpg');
      a.download = `${cleanTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
    } catch {
      window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.6));
  const handleResetZoom = () => setZoom(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 p-3 sm:p-6 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col lg:flex-row w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-2xl animate-scale-in">
        {/* Certificate Display Area */}
        <div className="relative flex-1 bg-ink-900/10 dark:bg-ink-900/50 flex flex-col items-center justify-center min-h-[350px] lg:min-h-[560px] p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
          {/* Top Control Bar for View Area */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            {/* View Mode Toggle (for PDFs) */}
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-parchment-100/90 p-1 shadow-md backdrop-blur border border-border">
              {isPdf && (
                <>
                  <button
                    onClick={() => setViewMode('image')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === 'image'
                        ? 'bg-ink-900 text-parchment-100 shadow-sm'
                        : 'text-ink-700 hover:bg-parchment-200'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setViewMode('pdf')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      viewMode === 'pdf'
                        ? 'bg-ink-900 text-parchment-100 shadow-sm'
                        : 'text-ink-700 hover:bg-parchment-200'
                    }`}
                  >
                    <FileText size={13} />
                    <span>PDF Reader</span>
                  </button>
                </>
              )}

              {!isPdf && (
                <span className="flex items-center gap-1 px-2 py-0.5 font-mono text-xs font-semibold text-ink-700">
                  <ImageIcon size={13} className="text-brass" />
                  <span>Certificate Image</span>
                </span>
              )}
            </div>

            {/* Zoom Controls */}
            {viewMode === 'image' && (
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-parchment-100/90 p-1 shadow-md backdrop-blur border border-border">
                <button
                  onClick={handleZoomOut}
                  className="rounded-lg p-1 text-ink-700 hover:bg-parchment-200 transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-ink-700 hover:bg-parchment-200 transition"
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="rounded-lg p-1 text-ink-700 hover:bg-parchment-200 transition"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Certificate Main Visual Area */}
          <div className="w-full h-full flex items-center justify-center overflow-auto pt-10 pb-2">
            {viewMode === 'pdf' && isPdf ? (
              <div className="w-full h-full min-h-[420px] rounded-xl overflow-hidden shadow-md border border-border bg-white">
                <iframe
                  src={`${rawDocumentUrl}#toolbar=1&navpanes=0`}
                  title={cert.title}
                  className="w-full h-full min-h-[480px] border-0"
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center max-w-full max-h-[70vh] transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                <img
                  src={previewImageUrl}
                  alt={cert.title}
                  className="max-h-[66vh] max-w-full rounded-xl object-contain shadow-xl border border-border/80 bg-white"
                />
              </div>
            )}
          </div>

          {/* Bottom Open in new tab hint */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <a
              href={rawDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-parchment-100/90 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur border border-border hover:bg-parchment-100 transition"
            >
              <ExternalLink size={13} />
              <span>Open File in Tab</span>
            </a>
          </div>
        </div>

        {/* Certificate Details Sidebar */}
        <div className="w-full lg:w-96 flex flex-col justify-between overflow-y-auto p-6 max-h-[50vh] lg:max-h-[94vh]">
          <div>
            {/* Header with Type badge and close */}
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-brass-dark">
                {EVENT_TYPE_LABELS[cert.eventType]}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-parchment-200 hover:text-ink-900 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-3 font-display text-xl font-bold text-ink-900 leading-snug">
              {cert.title}
            </h2>

            {/* Position Badge & Format */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-parchment-200/50 px-3 py-1 text-xs font-semibold text-ink-700">
                <Trophy size={14} className="text-brass" />
                {POSITION_LABELS[cert.position]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-parchment-200/50 px-3 py-1 text-xs font-medium text-ink-500 uppercase">
                {cert.mode}
              </span>
              {isPdf && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 text-xs font-mono font-semibold">
                  <FileText size={13} />
                  <span>PDF Document</span>
                </span>
              )}
            </div>

            {/* Details List */}
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-ink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold">Organizer</p>
                  <p className="font-medium text-ink-900">{cert.organizer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-ink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold">Date</p>
                  <p className="font-medium text-ink-900">
                    {formatDate(cert.startDate)}
                    {cert.endDate && cert.endDate !== cert.startDate
                      ? ` – ${formatDate(cert.endDate)}`
                      : ''}
                  </p>
                </div>
              </div>

              {cert.credentialUrl && (
                <div className="flex items-start gap-3">
                  <Globe size={16} className="text-ink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold">Credential Link</p>
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brass-dark hover:underline truncate max-w-xs block text-xs"
                    >
                      {cert.credentialUrl}
                    </a>
                  </div>
                </div>
              )}

              {cert.domainTags && cert.domainTags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag size={16} className="text-ink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold mb-1.5">Domains</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cert.domainTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-border bg-parchment-200/70 px-2 py-0.5 text-xs text-ink-700 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {cert.description && (
                <div className="pt-2 border-t border-border/80">
                  <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold mb-1">Description</p>
                  <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">
                    {cert.description}
                  </p>
                </div>
              )}

              {cert.notes && (
                <div className="pt-2 border-t border-border/80">
                  <p className="text-[11px] text-ink-500 uppercase font-mono font-semibold mb-1">Personal Notes</p>
                  <p className="text-xs text-ink-700 leading-relaxed italic whitespace-pre-wrap">
                    {cert.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-4 border-t border-border/80 flex items-center justify-between gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(cert);
                }}
                className="flex-1 rounded-xl border border-border bg-parchment-100 py-2.5 text-center text-xs font-semibold text-ink-900 hover:bg-parchment-200 transition"
              >
                Edit Details & File
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-xs font-semibold text-parchment-100 hover:bg-ink-700 transition shadow-sm disabled:opacity-75"
            >
              <Download size={14} />
              <span>{downloading ? 'Downloading…' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
