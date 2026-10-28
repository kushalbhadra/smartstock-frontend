import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(
    undefined
);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const push = useCallback((message: string, type: ToastType) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), 4000);
    }, [remove]);

    const success = useCallback(
        (m: string) => push(m, 'success'), [push]
    );
    const error = useCallback(
        (m: string) => push(m, 'error'), [push]
    );

    return (
        <ToastContext.Provider value={{ success, error }}>
            {children}
            <div className="fixed top-5 right-5 z-[100]
                            flex flex-col gap-2.5 max-w-sm w-full
                            pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex
                            items-start gap-3 rounded-xl px-4
                            py-3.5 shadow-lg border ${
                            t.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                    >
                        {t.type === 'success'
                            ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                            : <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        }
                        <p className="text-sm font-medium flex-1">
                            {t.message}
                        </p>
                        <button
                            onClick={() => remove(t.id)}
                            className="text-current opacity-60
                                       hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error(
        'useToast must be used within ToastProvider'
    );
    return ctx;
}