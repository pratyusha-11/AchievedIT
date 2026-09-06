import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  FolderOpen,
  Trophy,
  CalendarDays,
  Tag,
  AlertTriangle,
  Medal,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Certificate, EVENT_TYPE_LABELS, POSITION_LABELS, EventType, Position, Mode } from '../types';
import CertificateCard from '../components/CertificateCard';
import CertificateUploadModal from '../components/CertificateUploadModal';
import CertificateEditModal from '../components/CertificateEditModal';
import CertificateViewModal from '../components/CertificateViewModal';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonCard from '../components/SkeletonCard';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getErrorMessage } from '../lib/errorMessage';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certificate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters & Search
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<Mode | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const loadCerts = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get('/certificates');
      setCerts(data.certificates || []);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load your certificates.'));
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
      showToastError(getErrorMessage(err, 'Could not delete that certificate.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCertificateUpdated = (updated: Certificate) => {
    setCerts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToastSuccess(`"${updated.title}" updated successfully!`);
  };

  // Filtered and sorted certificates
  const filtered = useMemo(() => {
    return certs
      .filter((c) => {
        const matchesQuery =
          !query ||
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.organizer.toLowerCase().includes(query.toLowerCase()) ||
          (c.description ?? '').toLowerCase().includes(query.toLowerCase()) ||
          c.domainTags.some((t) => t.toLowerCase().includes(query.toLowerCase()));

        const matchesType = typeFilter === 'all' || c.eventType === typeFilter;
        const matchesPosition = positionFilter === 'all' || c.position === positionFilter;
        const matchesMode = modeFilter === 'all' || c.mode === modeFilter;

        return matchesQuery && matchesType && matchesPosition && matchesMode;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [certs, query, typeFilter, positionFilter, modeFilter, sortBy]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const wins = certs.filter((c) => c.position === 'winner' || c.position === 'runner_up').length;
    const years = new Set(
      certs.map((c) => (c.startDate ? c.startDate.slice(0, 4) : null)).filter(Boolean)
    );
    const allTags = new Set(certs.flatMap((c) => c.domainTags));

    return { total: certs.length, wins, years: years.size, tags: allTags.size };
  }, [certs]);

  const hasActiveFilters = query || typeFilter !== 'all' || positionFilter !== 'all' || modeFilter !== 'all';

  return (
    <div className="flex min-h-screen flex-col bg-parchment transition-colors duration-200">
      <Navbar onAddCertificate={() => setShowUploadModal(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {loadError && (
          <div className="mb-6">
            <Alert variant="error">
              {loadError}{' '}
              <button onClick={loadCerts} className="font-semibold underline underline-offset-2 ml-2">
                Try again
              </button>
            </Alert>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
              Welcome, {user?.fullName || 'Achiever'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Here is an overview of your achievements and verified credentials.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-parchment-100 shadow-md transition hover:bg-ink-700 active:scale-95"
          >
            <Plus size={17} />
            <span>Upload Certificate</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            label="Total Credentials"
            value={stats.total}
            icon={<FolderOpen size={20} />}
            color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label="Podium & Wins"
            value={stats.wins}
            icon={<Trophy size={20} />}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Active Years"
            value={stats.years}
            icon={<CalendarDays size={20} />}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Skill Domains"
            value={stats.tags}
            icon={<Tag size={20} />}
            color="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 rounded-2xl border border-border bg-parchment-100 p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, organizer, domain tag, description…"
                className="focus-ring w-full rounded-xl border border-border bg-parchment-200/50 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brass focus:bg-parchment-100"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500 hover:text-ink-900"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Event Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as EventType | 'all')}
                className="focus-ring rounded-xl border border-border bg-parchment-200/50 px-3 py-2 text-xs font-medium text-ink-900 outline-none transition hover:border-brass"
              >
                <option value="all">All Types</option>
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Position Filter */}
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value as Position | 'all')}
                className="focus-ring rounded-xl border border-border bg-parchment-200/50 px-3 py-2 text-xs font-medium text-ink-900 outline-none transition hover:border-brass"
              >
                <option value="all">All Outcomes</option>
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Mode Filter */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as Mode | 'all')}
                className="focus-ring rounded-xl border border-border bg-parchment-200/50 px-3 py-2 text-xs font-medium text-ink-900 outline-none transition hover:border-brass"
              >
                <option value="all">All Modes</option>
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="focus-ring rounded-xl border border-border bg-parchment-200/50 px-3 py-2 text-xs font-medium text-ink-900 outline-none transition hover:border-brass"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('all');
                    setPositionFilter('all');
                    setModeFilter('all');
                  }}
                  className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brass-dark hover:bg-brass/10 transition"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Cards View */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-fade-in rounded-2xl border border-dashed border-border bg-parchment-100 py-20 text-center px-4">
            {hasActiveFilters ? (
              <AlertTriangle size={36} className="mx-auto mb-3 text-ink-500" />
            ) : (
              <Medal size={36} className="mx-auto mb-3 text-brass" />
            )}

            <h3 className="font-display text-lg font-bold text-ink-900">
              {certs.length === 0 ? 'No certificates registered yet' : 'No matching certificates found'}
            </h3>
            <p className="mt-1 text-sm text-ink-500 max-w-sm mx-auto">
              {certs.length === 0
                ? 'Upload your first certificate image or PDF. Let AI extract the details for you.'
                : 'Try adjusting your search keywords or clearing active filters.'}
            </p>

            {certs.length === 0 ? (
              <button
                onClick={() => setShowUploadModal(true)}
                className="focus-ring mt-5 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-parchment-100 shadow transition hover:bg-ink-700"
              >
                <Plus size={16} />
                <span>Upload First Certificate</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setQuery('');
                  setTypeFilter('all');
                  setPositionFilter('all');
                  setModeFilter('all');
                }}
                className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-parchment-100 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-parchment-200 transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cert, index) => (
              <div
                key={cert.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <CertificateCard
                  cert={cert}
                  onOpen={() => setViewingCert(cert)}
                  onEdit={() => setEditingCert(cert)}
                  onDelete={() => setDeletingCert(cert)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Upload Modal */}
      {showUploadModal && (
        <CertificateUploadModal
          onClose={() => setShowUploadModal(false)}
          onSaved={loadCerts}
        />
      )}

      {/* View Modal */}
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

      {/* Edit Modal */}
      {editingCert && (
        <CertificateEditModal
          cert={editingCert}
          onClose={() => setEditingCert(null)}
          onUpdated={handleCertificateUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCert}
        title="Delete Certificate"
        description={`Are you sure you want to permanently delete "${deletingCert?.title}"? This will also remove the uploaded file from cloud storage.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Keep Certificate"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCert(null)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card-hover flex items-center gap-3.5 rounded-2xl border border-border bg-parchment-100 p-4 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-ink-900 leading-none">{value}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</p>
      </div>
    </div>
  );
}
