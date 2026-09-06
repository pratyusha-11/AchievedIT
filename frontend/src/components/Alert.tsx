import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info';

const STYLES: Record<AlertVariant, { bg: string; border: string; text: string; icon: JSX.Element }> = {
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-900',
    text: 'text-red-700 dark:text-red-300',
    icon: <AlertCircle size={16} className="shrink-0" />
  },
  success: {
    bg: 'bg-seal-completion/10',
    border: 'border-seal-completion/30',
    text: 'text-seal-completion',
    icon: <CheckCircle2 size={16} className="shrink-0" />
  },
  info: {
    bg: 'bg-brass/10',
    border: 'border-brass/30',
    text: 'text-brass-dark',
    icon: <Info size={16} className="shrink-0" />
  }
};

export default function Alert({ variant, children }: { variant: AlertVariant; children: React.ReactNode }) {
  const s = STYLES[variant];
  return (
    <div
      role="alert"
      className={`mb-4 flex items-start gap-2 rounded-md border ${s.bg} ${s.border} ${s.text} px-3 py-2.5 text-sm animate-fade-in`}
    >
      {s.icon}
      <span>{children}</span>
    </div>
  );
}
