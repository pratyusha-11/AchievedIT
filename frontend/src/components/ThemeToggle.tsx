import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-border bg-parchment-100 text-ink-500 transition-all duration-200 hover:border-brass hover:text-brass hover:rotate-12"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
