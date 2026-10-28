import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronRight, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Demo accounts for quick testing
const DEMO_ACCOUNTS = [
    { label: 'Admin',   email: 'admin@smartstock.com' },
    { label: 'Manager', email: 'priya@smartstock.com' },
    { label: 'Viewer',  email: 'sneha@smartstock.com' },
];

export default function LoginPage() {
    const { token, login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [email, setEmail] = useState('admin@smartstock.com');
    const [password, setPassword] = useState('demo1234');
    const [loading, setLoading] = useState(false);

    // Already logged in → redirect to dashboard
    useEffect(() => {
        if (token) navigate('/', { replace: true });
    }, [token, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authApi.login({ email, password });
            login(
                response.token,
                response.userId,
                response.role,
                response.warehouseId,
                response.name,
                response.phone
            );
            toast.success(`Welcome back, ${response.name}!`);
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message
                : 'Invalid email or password';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center
                        justify-center p-5 relative overflow-hidden">

            {/* Background decorative circles */}
            <div className="absolute w-[600px] h-[600px] rounded-full
                            border border-white/5 -top-64 -right-48" />
            <div className="absolute w-[450px] h-[450px] rounded-full
                            border border-white/5 -bottom-48 -left-40" />

            <div className="relative w-full max-w-[440px]">

                {/* Logo */}
                <div className="flex items-center justify-center
                                gap-3 mb-9">
                    <div className="w-11 h-11 bg-indigo-600 rounded-2xl
                                    flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-2xl
                                     tracking-tight">
                        SmartStock
                    </span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl
                                p-8 sm:p-10">
                    <p className="text-indigo-600 text-xs font-bold
                                  uppercase tracking-[0.16em] mb-3">
                        Inventory Intelligence
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome back
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 mb-8">
                        Sign in to manage your inventory workspace.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <label className="block">
                            <span className="block text-xs font-semibold
                                             text-slate-600 mb-2">
                                Email address
                            </span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full rounded-lg border
                                           border-slate-200 bg-white
                                           px-3 py-2.5 text-sm
                                           text-slate-800 outline-none
                                           focus:border-indigo-500
                                           focus:ring-2
                                           focus:ring-indigo-100"
                            />
                        </label>

                        <label className="block">
                            <span className="block text-xs font-semibold
                                             text-slate-600 mb-2">
                                Password
                            </span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full rounded-lg border
                                           border-slate-200 bg-white
                                           px-3 py-2.5 text-sm
                                           text-slate-800 outline-none
                                           focus:border-indigo-500
                                           focus:ring-2
                                           focus:ring-indigo-100"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center
                                       justify-center gap-2 rounded-lg
                                       bg-indigo-600 px-4 py-2.5
                                       text-sm font-semibold text-white
                                       hover:bg-indigo-700 disabled:opacity-60
                                       mt-2"
                        >
                            {loading
                                ? 'Signing in...'
                                : 'Sign in to workspace'
                            }
                            {!loading && (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-5 border-t border-slate-100
                                    text-center">
                        <p className="text-xs text-slate-400">
                            Demo accounts use password{' '}
                            <strong className="text-slate-600">
                                demo1234
                            </strong>
                        </p>
                        <div className="flex justify-center gap-3
                                        mt-2 text-[11px]">
                            {DEMO_ACCOUNTS.map(account => (
                                <button
                                    key={account.email}
                                    onClick={() => setEmail(account.email)}
                                    className="text-indigo-600
                                               hover:underline"
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500
                              mt-6 flex items-center
                              justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Smart, simple inventory operations.
                </p>
            </div>
        </div>
    );
}