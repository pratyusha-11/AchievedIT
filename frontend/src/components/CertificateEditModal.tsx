import { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { compressImageIfNeeded } from '../lib/compressImage';
import { getErrorMessage } from '../lib/errorMessage';
import { Certificate, EventType, Mode, Position, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';
import Alert from './Alert';
import Spinner from './Spinner';

interface CertificateEditModalProps {
  cert: Certificate | null;
  onClose: () => void;
  onUpdated: (updated: Certificate) => void;
}

const inputClass =
  'focus-ring w-full rounded-xl border border-border bg-parchment-100 px-3.5 py-2 text-sm outline-none transition-colors focus:border-brass';

export default function CertificateEditModal({
  cert,
  onClose,
  onUpdated
}: CertificateEditModalProps) {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [eventType, setEventType] = useState<EventType>('other');
  const [mode, setMode] = useState<Mode>('offline');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [position, setPosition] = useState<Position>('participant');
  const [tagsText, setTagsText] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // File replacement state
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cert) {
      setTitle(cert.title || '');
      setOrganizer(cert.organizer || '');
      setEventType(cert.eventType || 'other');
      setMode(cert.mode || 'offline');
      setStartDate(cert.startDate ? cert.startDate.slice(0, 10) : '');
      setEndDate(cert.endDate ? cert.endDate.slice(0, 10) : '');
      setPosition(cert.position || 'participant');
      setTagsText((cert.domainTags || []).join(', '));
      setCredentialUrl(cert.credentialUrl || '');
      setDescription(cert.description || '');
      setNotes(cert.notes || '');
      setNewFile(null);
      setNewPreviewUrl(null);
      setSaveError(null);
    }
  }, [cert]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
    };
  }, [newPreviewUrl]);

  if (!cert) return null;

  const handleFileSelect = async (file: File) => {
    setCompressing(true);
    const processed = await compressImageIfNeeded(file).catch(() => file);
    setCompressing(false);
    setNewFile(processed);
    setNewPreviewUrl(URL.createObjectURL(processed));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organizer.trim()) {
      setSaveError('Title and Organizer are required.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('organizer', organizer.trim());
      formData.append('eventType', eventType);
      formData.append('mode', mode);
      if (startDate) formData.append('startDate', startDate);
      if (endDate) formData.append('endDate', endDate);
      formData.append('position', position);
      formData.append('domainTags', tagsText);
      if (credentialUrl) formData.append('credentialUrl', credentialUrl.trim());
      if (description) formData.append('description', description.trim());
      if (notes) formData.append('notes', notes.trim());

      // If user provided a new file, append it for replacement
      if (newFile) {
        formData.append('file', newFile);
      }

      const { data } = await api.put(`/certificates/${cert.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onUpdated(data.certificate);
      onClose();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to update certificate details.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 py-6 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col max-h-[92vh] w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-parchment-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Edit Certificate</h2>
            <p className="text-xs text-ink-500">Update details or replace the uploaded file</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-parchment-200 hover:text-ink-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError && <Alert variant="error">{saveError}</Alert>}

          {/* File Replacement Section */}
          <div className="rounded-xl border border-dashed border-border bg-parchment-200/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500 block mb-2">
              Certificate Document / File
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="h-24 w-36 shrink-0 rounded-lg overflow-hidden border border-border bg-ink-900/5 flex items-center justify-center relative">
                {newPreviewUrl ? (
                  <img
                    src={newPreviewUrl}
                    alt="New file preview"
                    className="h-full w-full object-cover"
                  />
                ) : cert.fileUrl ? (
                  <img
                    src={cert.fileUrl}
                    alt={cert.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText size={24} className="text-ink-500" />
                )}

                {newFile && (
                  <span className="absolute top-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white">
                    <CheckCircle2 size={12} />
                  </span>
                )}
              </div>

              {/* Action */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-medium text-ink-900">
                  {newFile ? `New file chosen: ${newFile.name}` : 'Keep current certificate file or replace it'}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Supports JPG, PNG, and PDF (replaces the asset in cloud storage)
                </p>

                <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-parchment-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-parchment-200 hover:text-ink-900 transition"
                  >
                    {compressing ? <Spinner size={13} /> : <RefreshCw size={13} />}
                    <span>{newFile ? 'Select Different File' : 'Replace Certificate File'}</span>
                  </button>
                  {newFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewFile(null);
                        setNewPreviewUrl(null);
                      }}
                      className="text-xs text-rose-500 hover:underline px-2 py-1"
                    >
                      Revert
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Title *
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. AWS Certified Solutions Architect"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Organizer *
              </label>
              <input
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className={inputClass}
                placeholder="Issuing institution or company"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className={inputClass}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className={inputClass}
              >
                <option value="offline">Offline / In-person</option>
                <option value="online">Online / Remote</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Position / Outcome
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className={inputClass}
              >
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Domain Tags
              </label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className={inputClass}
                placeholder="Cloud, DevOps, Full-Stack (comma-separated)"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Credential Verification Link
              </label>
              <input
                type="url"
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                className={inputClass}
                placeholder="https://credly.com/..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Key accomplishments or syllabus summary..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                Personal Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder="Context, team members, lessons learned..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-ink-500 hover:bg-parchment-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2 text-sm font-medium text-parchment-100 hover:bg-ink-700 transition disabled:opacity-50"
            >
              {saving && <Spinner size={14} />}
              <span>{saving ? 'Saving changes…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
