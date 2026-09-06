import { useEffect, useMemo, useState } from 'react';
import { Award, Search, Plus, Filter, Trophy, Calendar, ExternalLink, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Certificate, EventType, Position, EVENT_TYPE_LABELS, POSITION_LABELS } from '../types';
import CertificateCard from '../components/CertificateCard';
import CertificateViewModal from '../components/CertificateViewModal';
import CertificateEditModal from '../components/CertificateEditModal';
import CertificateUploadModal from '../components/CertificateUploadModal';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonCard from '../components/SkeletonCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getErrorMessage } from '../lib/errorMessage';

export default function Achievements() {
  const { user, loading: authLoading } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certificate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');

  const loadCerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/certificates');
      setCerts(data.certificates || []);
    } catch (err) {
      showToastError(getErrorMessage(err, 'Could not load achievements.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadCerts();
    }
  }, [authLoading, user?.id]);

  const handleConfirmDelete = async () => {
    if (!deletingCert) return;
    setDeleteLoading(true);
    const previous = certs;
    setCerts((prev) => prev.filter((c) => c.id !== deletingCert.id));

    try {
      await api.delete(`/certificates/${deletingCert.id}`);
      showToastSuccess(`"${deletingCert.title}" was deleted.`);
      setDeletingCert(null);
    } catch (err) {
      setCerts(previous);
      showToastError(getErrorMessage(err, 'Failed to delete certificate.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCertificateUpdated = (updated: Certificate) => {
    setCerts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToastSuccess(`"${updated.title}" updated successfully!`);
  };

  const filtered = useMemo(() => {
    return certs.filter((c) => {
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.organizer.toLowerCase().includes(query.toLowerCase()) ||
        c.domainTags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesType = selectedType === 'all' || c.eventType === selectedType;
      return matchesQuery && matchesType;
    });
  }, [certs, query, selectedType]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = { all: certs.length };
    certs.forEach((c) => {
      counts[c.eventType] = (counts[c.eventType] || 0) + 1;
    });
    return counts;
  }, [certs]);

  return (
    <div className="flex min-h-screen flex-col bg-parchment transition-colors duration-200">
      <Navbar onAddCertificate={() => setShowUploadModal(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="text-brass" size={24} />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
                Achievements Portfolio
              </h1>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              A gallery of all your verified milestones, competitions, and credentials.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-parchment-100 shadow transition hover:bg-ink-700"
          >
            <Plus size={16} />
            <span>Add New</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedType('all')}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
              selectedType === 'all'
                ? 'bg-ink-900 text-parchment-100 shadow-sm'
                : 'border border-border bg-parchment-100 text-ink-700 hover:bg-parchment-200'
            }`}
          >
            All Milestones ({categories.all || 0})
          </button>
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
            const count = categories[key] || 0;
            if (count === 0 && certs.length > 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key as EventType)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  selectedType === key
                    ? 'bg-ink-900 text-parchment-100 shadow-sm'
                    : 'border border-border bg-parchment-100 text-ink-700 hover:bg-parchment-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search achievements..."
            className="focus-ring w-full rounded-xl border border-border bg-parchment-100 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brass"
          />
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-parchment-100 py-16 text-center">
            <Trophy size={36} className="mx-auto mb-3 text-brass" />
            <h3 className="font-display text-lg font-bold text-ink-900">
              No achievements found
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              {certs.length === 0
                ? 'Start recording your achievements today.'
                : 'No certificates match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                onOpen={() => setViewingCert(cert)}
                onEdit={() => setEditingCert(cert)}
                onDelete={() => setDeletingCert(cert)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {showUploadModal && (
        <CertificateUploadModal
          onClose={() => setShowUploadModal(false)}
          onSaved={loadCerts}
        />
      )}

      {viewingCert && (
        <CertificateViewModal
          cert={viewingCert}
          onClose={() => setViewingCert(null)}
          onEdit={(c) => {
            setViewingCert(null);
            setEditingCert(c);
          }}
        />
      )}

      {editingCert && (
        <CertificateEditModal
          cert={editingCert}
          onClose={() => setEditingCert(null)}
          onUpdated={handleCertificateUpdated}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingCert}
        title="Delete Milestone"
        description={`Are you sure you want to delete "${deletingCert?.title}"?`}
        confirmLabel="Yes, Delete"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCert(null)}
      />
    </div>
  );
}
