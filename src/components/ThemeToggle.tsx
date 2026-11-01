import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.classList.contains('dark')
    );

    const toggleTheme = () => {
        const nextIsDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', nextIsDark);
        localStorage.setItem(
            'smartstock-theme',
            nextIsDark ? 'dark' : 'light'
        );
        setIsDark(nextIsDark);
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'day' : 'night'} mode`}
            title={`Switch to ${isDark ? 'day' : 'night'} mode`}
            className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-11
                       items-center justify-center rounded-full border
                       border-slate-200 bg-white text-slate-700 shadow-lg
                       transition hover:bg-slate-50 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-indigo-500
                       dark:border-slate-600 dark:bg-slate-800
                       dark:text-slate-100 dark:hover:bg-slate-700"
        >
            {isDark
                ? <Sun className="h-5 w-5" aria-hidden="true" />
                : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>
    );
}
