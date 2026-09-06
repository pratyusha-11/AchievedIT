import { Trash2, Edit3, Eye, ExternalLink, ImageOff, FileText, Calendar, Tag } from 'lucide-react';
import { Certificate, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';
import { getCertificatePreviewUrl } from '../lib/pdfHelper';

const SEAL_CONFIG: Record<string, { badge: string; dot: string }> = {
  winner: {
    badge:
      'border-amber-400/60 dark:border-amber-400/70 text-amber-700 dark:text-amber-200 bg-white/95 dark:bg-[#181524]/95 shadow-md',
    dot: 'bg-amber-500'
  },
  runner_up: {
    badge:
      'border-indigo-400/60 dark:border-indigo-400/70 text-indigo-700 dark:text-indigo-200 bg-white/95 dark:bg-[#181524]/95 shadow-md',
    dot: 'bg-indigo-500'
  },
  finalist: {
    badge:
      'border-purple-400/60 dark:border-purple-400/70 text-purple-700 dark:text-purple-200 bg-white/95 dark:bg-[#181524]/95 shadow-md',
    dot: 'bg-purple-500'
  },
  participant: {
    badge:
      'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-[#181524]/95 shadow-md',
    dot: 'bg-slate-400'
  },
  completion: {
    badge:
      'border-emerald-400/60 dark:border-emerald-400/70 text-emerald-700 dark:text-emerald-200 bg-white/95 dark:bg-[#181524]/95 shadow-md',
    dot: 'bg-emerald-500'
  }
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface CertificateCardProps {
  cert: Certificate;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export default function CertificateCard({
  cert,
  onOpen,
  onEdit,
  onDelete
}: CertificateCardProps) {
  const isPdf =
    cert.fileKind === 'pdf' ||
    cert.fileUrl.toLowerCase().endsWith('.pdf') ||
    cert.fileUrl.includes('.pdf?') ||
    cert.fileUrl.includes('/pdf/') ||
    (cert.rawFileUrl && cert.rawFileUrl.toLowerCase().endsWith('.pdf'));

  const previewImageUrl = getCertificatePreviewUrl(cert);
  const seal = SEAL_CONFIG[cert.position] || SEAL_CONFIG.participant;

  return (
    <div className="card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-brass/40">
      {/* Top Banner / Stamp */}
      <div className="relative">
        {/* Outcome Seal: Always opaque with high contrast in both light & dark modes */}
        <div
          className={`absolute right-3 top-3 z-10 flex h-7 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform duration-200 group-hover:scale-105 ${seal.badge}`}
          title={`Position: ${POSITION_LABELS[cert.position]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${seal.dot} shrink-0`} />
          <span>{POSITION_LABELS[cert.position]}</span>
        </div>

        {/* Thumbnail Preview: Shows actual certificate image for both images and PDFs */}
        <div
          onClick={onOpen}
          className="relative h-44 w-full cursor-pointer overflow-hidden bg-ink-900/5 dark:bg-ink-900/20"
        >
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={cert.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 font-mono text-xs text-ink-500">
              <ImageOff size={20} />
              <span>No preview</span>
            </div>
          )}

          {/* PDF indicator pill: Solid dark glass with crisp white text in both light and dark mode */}
          {isPdf && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
              <FileText size={11} className="text-rose-400 shrink-0" />
              <span>PDF</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
            <span className="flex items-center gap-1.5 rounded-xl bg-parchment-100 px-3.5 py-1.5 text-xs font-semibold text-ink-900 shadow-lg">
              <Eye size={14} />
              <span>Preview</span>
            </span>
          </div>
        </div>
      </div>

      {/* Perforated Stub Divider */}
      <div className="stub-edge h-2 border-y border-dashed border-border" />

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brass-dark">
            {EVENT_TYPE_LABELS[cert.eventType]}
          </span>
          <span className="font-mono text-[10px] text-ink-500 uppercase">
            {cert.mode}
          </span>
        </div>

        <h3
          onClick={onOpen}
          className="cursor-pointer font-display text-base font-bold text-ink-900 line-clamp-2 hover:text-brass transition-colors leading-snug"
          title={cert.title}
        >
          {cert.title}
        </h3>

        <p className="mt-1 text-xs text-ink-500 font-medium truncate">
          {cert.organizer}
        </p>

        {/* Dates */}
        <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-ink-500">
          <Calendar size={13} className="text-ink-500 shrink-0" />
          <span>
            {formatDate(cert.startDate)}
            {cert.endDate && cert.endDate !== cert.startDate
              ? ` – ${formatDate(cert.endDate)}`
              : ''}
          </span>
        </div>

        {/* Domain Tags */}
        {cert.domainTags && cert.domainTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {cert.domainTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-parchment-200/60 px-2 py-0.5 font-mono text-[10px] text-ink-700"
              >
                #{tag}
              </span>
            ))}
            {cert.domainTags.length > 3 && (
              <span className="rounded-md border border-border bg-parchment-200/60 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
                +{cert.domainTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="mt-5 pt-3 border-t border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* View Preview */}
            <button
              onClick={onOpen}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-parchment-200 transition"
              title="View Certificate"
            >
              <Eye size={13} />
              <span>View</span>
            </button>

            {/* Edit Certificate */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-parchment-200 transition"
                title="Edit Certificate"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}

            {/* External Credential Link */}
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brass-dark hover:bg-brass/10 transition"
                title="Open Credential Verification"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Delete action */}
          <button
            onClick={onDelete}
            aria-label="Delete certificate"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
            title="Delete Certificate"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
