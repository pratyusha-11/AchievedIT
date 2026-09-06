import { useEffect } from 'react';
import { X, ExternalLink, Download, Calendar, Tag, Trophy, Building2, Globe, FileText, CheckCircle } from 'lucide-react';
import { Certificate, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (cert) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cert, onClose]);

  if (!cert) return null;

  const isPdf =
    cert.fileKind === 'pdf' ||
    cert.fileUrl.toLowerCase().endsWith('.pdf') ||
    cert.fileUrl.includes('/pdf/') ||
    cert.fileUrl.includes('.pdf?');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 sm:p-6 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col lg:flex-row w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-2xl animate-scale-in">
        {/* Certificate Display Area */}
        <div className="relative flex-1 bg-ink-900/5 dark:bg-ink-900/40 flex flex-col items-center justify-center min-h-[320px] lg:min-h-[540px] p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
          {isPdf ? (
            <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
                <FileText size={36} />
              </div>
              <h4 className="font-display text-lg font-semibold text-ink-900 mb-1">
                PDF Certificate
              </h4>
              <p className="text-sm text-ink-500 max-w-sm mb-6">
                Click below to view the original PDF document in your browser reader.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-parchment-100 shadow hover:bg-ink-700 transition"
                >
                  <ExternalLink size={16} />
                  <span>Open PDF in Full Screen</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-full h-full max-h-[70vh]">
              <img
                src={cert.fileUrl}
                alt={cert.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          )}

          {/* Quick open in new tab float */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-parchment-100/90 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm backdrop-blur hover:bg-parchment-100 transition"
            >
              <ExternalLink size={14} />
              <span>Full View</span>
            </a>
          </div>
        </div>

        {/* Certificate Details Sidebar */}
        <div className="w-full lg:w-96 flex flex-col justify-between overflow-y-auto p-6 max-h-[50vh] lg:max-h-[92vh]">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-brass-dark">
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

            {/* Position Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-parchment-200/50 px-3 py-1 text-xs font-semibold text-ink-700">
                <Trophy size={14} className="text-brass" />
                {POSITION_LABELS[cert.position]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-parchment-200/50 px-3 py-1 text-xs font-medium text-ink-500 uppercase">
                {cert.mode}
              </span>
            </div>

            {/* Details List */}
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-ink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-ink-500 uppercase font-mono">Organizer</p>
                  <p className="font-medium text-ink-900">{cert.organizer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-ink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-ink-500 uppercase font-mono">Date</p>
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
                    <p className="text-xs text-ink-500 uppercase font-mono">Credential Link</p>
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
                    <p className="text-xs text-ink-500 uppercase font-mono mb-1.5">Domains</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cert.domainTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border bg-parchment-200/70 px-2 py-0.5 text-xs text-ink-700"
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
                  <p className="text-xs text-ink-500 uppercase font-mono mb-1">Description</p>
                  <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">
                    {cert.description}
                  </p>
                </div>
              )}

              {cert.notes && (
                <div className="pt-2 border-t border-border/80">
                  <p className="text-xs text-ink-500 uppercase font-mono mb-1">Personal Notes</p>
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
                className="flex-1 rounded-xl border border-border bg-parchment-100 py-2 text-center text-sm font-medium text-ink-900 hover:bg-parchment-200 transition"
              >
                Edit Details
              </button>
            )}
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-100 hover:bg-ink-700 transition"
            >
              <Download size={15} />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
