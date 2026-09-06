import { useRef, useState, useEffect } from 'react';
import { X, UploadCloud, Sparkles, PenLine, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { compressImageIfNeeded } from '../lib/compressImage';
import { getErrorMessage } from '../lib/errorMessage';
import { renderPdfPageToDataUrl } from '../lib/pdfHelper';
import { EventType, Mode, Position, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';
import Alert from './Alert';
import Spinner from './Spinner';

type Step = 'upload' | 'choose' | 'review';

interface FormState {
  title: string;
  organizer: string;
  eventType: EventType;
  mode: Mode;
  startDate: string;
  endDate: string;
  position: Position;
  credentialUrl: string;
  description: string;
  notes: string;
}

const BLANK: FormState = {
  title: '',
  organizer: '',
  eventType: 'hackathon',
  mode: 'offline',
  startDate: '',
  endDate: '',
  position: 'participant',
  credentialUrl: '',
  description: '',
  notes: ''
};

const inputClass =
  'focus-ring w-full rounded-xl border border-border bg-parchment-100 px-3.5 py-2 text-sm outline-none transition-colors focus:border-brass';

export default function CertificateUploadModal({
  onClose,
  onSaved
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [tagsText, setTagsText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [isAiExtracted, setIsAiExtracted] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = async (raw: File) => {
    setCompressing(true);
    let processed = raw;
    let visualPreview = '';

    if (raw.type === 'application/pdf') {
      try {
        visualPreview = await renderPdfPageToDataUrl(raw);
      } catch (err) {
        console.warn('Could not render PDF preview in browser:', err);
        visualPreview = URL.createObjectURL(raw);
      }
    } else {
      processed = await compressImageIfNeeded(raw).catch(() => raw);
      visualPreview = URL.createObjectURL(processed);
    }

    setCompressing(false);
    setFile(processed);
    setPreviewUrl(visualPreview);
    setStep('choose');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const fillManually = () => {
    setIsAiExtracted(false);
    setStep('review');
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const extractWithAI = async () => {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    try {
      let base64 = '';
      let mediaType = file.type;

      // If PDF, use rendered JPEG data URL from page 1 so Groq vision can process it!
      if (file.type === 'application/pdf') {
        if (previewUrl && previewUrl.startsWith('data:image/')) {
          base64 = previewUrl.split(',')[1];
          mediaType = 'image/jpeg';
        } else {
          const renderedDataUrl = await renderPdfPageToDataUrl(file);
          base64 = renderedDataUrl.split(',')[1];
          mediaType = 'image/jpeg';
        }
      } else {
        base64 = await fileToBase64(file);
      }

      const { data } = await api.post('/certificates/extract', {
        image: base64,
        mediaType: mediaType
      });

      setForm((prev) => ({
        ...prev,
        title: data.title || '',
        organizer: data.organizer || '',
        eventType: (data.eventType as EventType) || 'other',
        mode: (data.mode as Mode) || 'offline',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        position: (data.position as Position) || 'participant',
        credentialUrl: data.credentialUrl || '',
        description: data.description || ''
      }));
      setTagsText((data.domainTags || []).join(', '));
      setIsAiExtracted(true);
      setStep('review');
    } catch (err) {
      setExtractError(
        getErrorMessage(err, 'AI extraction could not read this certificate. You can easily review and enter details manually.')
      );
      setIsAiExtracted(false);
      setStep('review');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!form.title.trim() || !form.organizer.trim()) {
      setSaveError('Title and Organizer are required.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('title', form.title.trim());
      body.append('organizer', form.organizer.trim());
      body.append('eventType', form.eventType);
      body.append('mode', form.mode);
      if (form.startDate) body.append('startDate', form.startDate);
      if (form.endDate) body.append('endDate', form.endDate);
      body.append('position', form.position);
      body.append('domainTags', tagsText);
      if (form.credentialUrl) body.append('credentialUrl', form.credentialUrl.trim());
      if (form.description) body.append('description', form.description.trim());
      if (form.notes) body.append('notes', form.notes.trim());

      await api.post('/certificates', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSaved();
      onClose();
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Something went wrong while saving your certificate.'));
    } finally {
      setSaving(false);
    }
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 py-6 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col max-h-[92vh] w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-parchment-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-parchment-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-ink-900">Add Certificate</h2>
            {/* Step badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-500 font-medium">
              <span className={`px-2 py-0.5 rounded-md ${step === 'upload' ? 'bg-brass/15 text-brass-dark font-bold' : ''}`}>1. Upload</span>
              <span>→</span>
              <span className={`px-2 py-0.5 rounded-md ${step === 'choose' ? 'bg-brass/15 text-brass-dark font-bold' : ''}`}>2. Method</span>
              <span>→</span>
              <span className={`px-2 py-0.5 rounded-md ${step === 'review' ? 'bg-brass/15 text-brass-dark font-bold' : ''}`}>3. Review & Save</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-parchment-200 hover:text-ink-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="focus-ring flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-parchment-200/40 px-6 py-16 text-center transition-all hover:border-brass hover:bg-brass/5"
            >
              {compressing ? (
                <>
                  <Spinner size={32} className="mb-3 text-brass" />
                  <p className="font-display text-lg font-semibold text-ink-900">Preparing certificate document…</p>
                  <p className="mt-1 text-xs text-ink-500">Generating preview and optimizing resolution</p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brass/10 text-brass mb-4">
                    <UploadCloud size={30} />
                  </div>
                  <p className="font-display text-lg font-semibold text-ink-900">
                    Upload Certificate Image or PDF
                  </p>
                  <p className="mt-1 text-sm text-ink-500 max-w-sm">
                    Drag and drop your certificate here, or click to browse. Supports JPG, PNG, and PDF files.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-xs font-semibold text-parchment-100 shadow">
                    Browse from computer
                  </span>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          )}

          {/* STEP 2: CHOOSE EXTRACTION METHOD */}
          {step === 'choose' && (
            <div className="animate-fade-in space-y-6">
              {/* Visual Preview Box */}
              <div className="flex justify-center">
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg max-h-52 bg-white flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="certificate preview"
                      className="h-48 w-auto max-w-full object-contain"
                    />
                    {isPdf && (
                      <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
                        <FileText size={11} className="text-rose-400 shrink-0" />
                        <span>PDF (Page 1)</span>
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg border border-white/10 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-md shadow">
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-40 w-full max-w-md flex-col items-center justify-center gap-2 rounded-xl border border-border bg-parchment-200/50 p-4 font-mono text-xs text-ink-500">
                    <FileText size={32} className="text-rose-500" />
                    <span className="font-semibold text-ink-900 text-sm">{file?.name}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <h3 className="font-display text-base font-semibold text-ink-900">
                  How would you like to input the certificate details?
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  You can review and edit all fields before saving.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={extractWithAI}
                  disabled={extracting}
                  className="focus-ring group rounded-2xl border-2 border-brass/40 bg-gradient-to-br from-brass/10 to-violet-500/5 p-5 text-left transition hover:border-brass hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/20 text-brass">
                      {extracting ? <Spinner size={18} /> : <Sparkles size={18} />}
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brass-dark">
                      Instant AI
                    </span>
                  </div>
                  <p className="font-display font-bold text-ink-900 group-hover:text-brass transition-colors">
                    {extracting ? 'Extracting with AI…' : 'Extract with AI'}
                  </p>
                  <p className="mt-1 text-xs text-ink-500 leading-relaxed">
                    Multimodal AI analyzes the certificate image and pre-fills title, organizer, position, and dates for your review.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={fillManually}
                  className="focus-ring group rounded-2xl border border-border bg-parchment-100 p-5 text-left transition hover:border-ink-500 hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-parchment-200 text-ink-700 mb-2">
                    <PenLine size={18} />
                  </div>
                  <p className="font-display font-bold text-ink-900">Fill in Manually</p>
                  <p className="mt-1 text-xs text-ink-500 leading-relaxed">
                    Prefer entering details by hand? Jump straight to the manual form.
                  </p>
                </button>
              </div>

              <div className="flex justify-start pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 transition"
                >
                  <ArrowLeft size={14} />
                  <span>Choose different file</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW, EDIT & SAVE */}
          {step === 'review' && (
            <form onSubmit={handleSave} className="animate-fade-in space-y-5">
              {/* Document Preview Card in Review */}
              {previewUrl && (
                <div className="flex items-center gap-4 rounded-xl border border-border bg-parchment-200/50 p-3">
                  <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center shadow-sm">
                    <img src={previewUrl} alt="review preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-900 truncate">
                      {file?.name}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {isPdf ? 'PDF Certificate · Visual preview rendered' : 'Image Certificate'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-xs font-semibold text-brass-dark hover:underline whitespace-nowrap"
                  >
                    Change Method
                  </button>
                </div>
              )}

              {/* AI Extraction Guidance Banner */}
              {isAiExtracted && (
                <div className="flex items-start gap-3 rounded-xl border border-brass/30 bg-brass/10 p-3.5 text-xs text-ink-700">
                  <Sparkles size={18} className="text-brass shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-ink-900">
                      AI Extracted Details — Please Review & Edit
                    </p>
                    <p className="mt-0.5 text-ink-500">
                      Our vision model extracted the details below. You can correct or adjust any fields before saving.
                    </p>
                  </div>
                </div>
              )}

              {extractError && <Alert variant="info">{extractError}</Alert>}
              {saveError && <Alert variant="error">{saveError}</Alert>}

              {/* Form Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Certificate Title *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Winner - Smart India Hackathon 2026"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Issuing Organizer *
                  </label>
                  <input
                    required
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    className={inputClass}
                    placeholder="Organization, College, or Platform"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Event Type
                  </label>
                  <select
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
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
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Mode
                  </label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value as Mode })}
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
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value as Position })}
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
                    placeholder="AI, Full-Stack, CyberSecurity (comma separated)"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Credential Verification URL
                  </label>
                  <input
                    type="url"
                    value={form.credentialUrl}
                    onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputClass}
                    placeholder="Key highlights of this achievement..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Personal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={inputClass}
                    placeholder="Private notes (mentors, teammates, context)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900 transition"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
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
                    className="flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2 text-sm font-medium text-parchment-100 hover:bg-ink-700 transition shadow-sm disabled:opacity-50"
                  >
                    {saving && <Spinner size={14} />}
                    <span>{saving ? 'Saving certificate…' : 'Save Certificate'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
