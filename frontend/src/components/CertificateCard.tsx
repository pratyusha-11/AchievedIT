import { Trash2, Edit3, Eye, ExternalLink, ImageOff, FileText, Calendar, Tag } from 'lucide-react';
import { Certificate, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';

const SEAL_COLOR: Record<string, string> = {
  winner: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
  runner_up: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
  finalist: 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40',
  participant: 'border-slate-400 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40',
  completion: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
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
    cert.fileUrl.includes('/pdf/');

  return (
    <div className="card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-brass/40">
      {/* Top Banner / Stamp */}
      <div className="relative">
        {/* Outcome Seal */}
        <div
          className={`absolute right-3 top-3 z-10 flex h-10 px-2.5 items-center justify-center rounded-xl border font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur transition-transform duration-200 group-hover:scale-105 ${
            SEAL_COLOR[cert.position] || SEAL_COLOR.participant
          }`}
          title={`Position: ${POSITION_LABELS[cert.position]}`}
        >
          {POSITION_LABELS[cert.position]}
        </div>

        {/* Thumbnail or PDF placeholder */}
        <div
          onClick={onOpen}
          className="relative h-40 w-full cursor-pointer overflow-hidden bg-ink-900/5 dark:bg-ink-900/20"
        >
          {isPdf ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-sm">
                <FileText size={26} />
              </div>
              <span className="font-mono text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                PDF Document
              </span>
            </div>
          ) : cert.fileUrl ? (
            <img
              src={cert.fileUrl}
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
