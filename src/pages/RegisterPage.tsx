import {
    useEffect,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Package, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import {
    normalizeEmail,
    normalizeIndianPhone,
    validateEmail,
    validateIndianPhone,
    validatePasswordStrength,
} from '../utils/contactValidation';

type RegistrationErrors = {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
};

export default function RegisterPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { error: showError, success: showSuccess } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<RegistrationErrors>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) navigate('/', { replace: true });
    }, [token, navigate]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const nextErrors: RegistrationErrors = {};
        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        if (!cleanName) nextErrors.name = 'Full name is required.';
        else if (cleanName.length > 100) {
            nextErrors.name = 'Full name must be 100 characters or fewer.';
        }
        nextErrors.email = validateEmail(email, true);
        nextErrors.phone = validateIndianPhone(cleanPhone);
        nextErrors.password = validatePasswordStrength(password);
        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password.';
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setSubmitting(true);
        try {
            const user = await authApi.register({
                name: cleanName,
                email: normalizeEmail(email),
                phone: normalizeIndianPhone(cleanPhone),
                password,
            });
            showSuccess('Your viewer account is ready. Sign in to continue.');
            navigate('/login', {
                replace: true,
                state: { registeredEmail: user.email },
            });
        } catch (reason) {
            showError(getApiErrorMessage(
                reason, 'Could not create your account. Please try again.'
            ));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center
                         overflow-hidden bg-slate-900 p-5">
            <div className="pointer-events-none absolute -right-36 -top-32
                            h-[34rem] w-[34rem] rounded-full bg-indigo-600/20 blur-3xl" />
            <section className="relative w-full max-w-[480px]">
                <Link to="/"
                    className="mb-7 flex items-center justify-center gap-3"
                    aria-label="GoodsPilot home">
                    <span className="flex h-11 w-11 items-center justify-center
                                     rounded-2xl bg-indigo-600">
                        <Package className="h-6 w-6 text-white" />
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-white">
                        GoodsPilot
                    </span>
                </Link>

                <div className="rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
                    <p className="text-xs font-bold uppercase tracking-[0.16em]
                                  text-indigo-600">
                        Smart Inventory. Smarter Operations.
                    </p>
                    <h1 className="mt-3 text-2xl font-bold text-slate-900">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Registration creates a read-only Viewer account.
                        An administrator can update access later.
                    </p>

                    <form onSubmit={handleSubmit}
                        className="mt-7 space-y-4" noValidate>
                        <Field label="Full name" error={errors.name}>
                            <input
                                autoComplete="name"
                                className="input"
                                value={name}
                                onChange={event => setName(event.target.value)}
                                aria-invalid={!!errors.name}
                                required
                            />
                        </Field>
                        <Field label="Email address" error={errors.email}>
                            <input
                                type="email"
                                autoComplete="email"
                                className="input"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                aria-invalid={!!errors.email}
                                required
                            />
                        </Field>
                        <Field label="Phone number (optional)"
                            error={errors.phone}>
                            <input
                                type="tel"
                                autoComplete="tel"
                                className="input"
                                placeholder="9876543210"
                                value={phone}
                                onChange={event => setPhone(event.target.value)}
                                aria-invalid={!!errors.phone}
                            />
                        </Field>
                        <Field label="Password" error={errors.password}>
                            <input
                                type="password"
                                autoComplete="new-password"
                                className="input"
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                aria-invalid={!!errors.password}
                                required
                            />
                            <span className="mt-1 block text-xs text-slate-400">
                                Use at least 8 characters, including a letter
                                and a number.
                            </span>
                        </Field>
                        <Field label="Confirm password"
                            error={errors.confirmPassword}>
                            <input
                                type="password"
                                autoComplete="new-password"
                                className="input"
                                value={confirmPassword}
                                onChange={event =>
                                    setConfirmPassword(event.target.value)}
                                aria-invalid={!!errors.confirmPassword}
                                required
                            />
                        </Field>
                        <button
                            type="submit"
                            className="btn-primary mt-2 w-full"
                            disabled={submitting}
                        >
                            {submitting ? 'Creating account...' : 'Create account'}
                            {!submitting && <ChevronRight className="h-4 w-4" />}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-slate-100 pt-5 text-center
                                    text-sm text-slate-500">
                        Already registered?{' '}
                        <Link to="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Sign in
                        </Link>
                    </div>
                </div>

                <p className="mt-5 flex items-center justify-center gap-2
                              text-center text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    Intelligent Inventory and Warehouse Management
                </p>
            </section>
        </main>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="label">{label}</span>
            {children}
            {error && (
                <span role="alert" className="mt-1 block text-xs text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}
