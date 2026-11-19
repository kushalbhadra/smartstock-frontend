import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Bell, KeyRound, Save, UserRound } from 'lucide-react';
import { settingsApi } from '../api/settingsApi';
import { userApi } from '../api/userApi';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import { validatePasswordStrength } from '../utils/contactValidation';
import {
    normalizeEmail,
    normalizeIndianPhone,
    validateEmail,
    validateIndianPhone,
} from '../utils/contactValidation';
import type { SystemSettings, User, UserProfileRequest } from '../types';

const EMPTY_PROFILE: UserProfileRequest = {
    name: '',
    phone: '',
};

const EMPTY_SETTINGS: SystemSettings = {
    companyName: 'GoodsPilot',
    contactEmail: '',
    contactPhone: '',
    defaultLowStockThreshold: 10,
};

export default function SettingsPage() {
    const { updateProfile, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const { error: showError, success: showSuccess } = useToast();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [settings, setSettings] = useState(EMPTY_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [settingsLoadError, setSettingsLoadError] =
        useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});
    const [savingPassword, setSavingPassword] = useState(false);
    const [profilePhoneError, setProfilePhoneError] = useState<string>();
    const [contactErrors, setContactErrors] = useState<{
        email?: string;
        phone?: string;
    }>({});

    useEffect(() => {
        let isActive = true;
        void Promise.allSettled([
            userApi.getCurrentProfile(),
            isAdmin ? settingsApi.get() : Promise.resolve(null),
        ]).then(([profileResult, settingsResult]) => {
            if (!isActive) return;
            if (profileResult.status === 'fulfilled') {
                setProfile(toProfileForm(profileResult.value));
                setLoadError(null);
            } else {
                const message = getApiErrorMessage(
                    profileResult.reason, 'Failed to load your profile'
                );
                setLoadError(message);
                showError(message);
            }
            if (settingsResult.status === 'fulfilled') {
                setSettingsLoadError(null);
                if (settingsResult.value) setSettings(settingsResult.value);
            } else {
                const message = getApiErrorMessage(
                    settingsResult.reason, 'Failed to load company settings'
                );
                setSettingsLoadError(message);
                showError(message);
            }
            setLoading(false);
        });
        return () => {
            isActive = false;
        };
    }, [isAdmin, loadAttempt, showError]);

    const retrySettingsLoad = () => {
        setLoading(true);
        setLoadAttempt(attempt => attempt + 1);
    };

    const handleProfileSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!profile.name.trim() || profile.name.trim().length > 100) {
            showError('Name is required and must be 100 characters or fewer');
            return;
        }
        const phoneError = validateIndianPhone(profile.phone);
        setProfilePhoneError(phoneError);
        if (phoneError) return;

        setSavingProfile(true);
        try {
            const saved = await userApi.updateCurrentProfile({
                ...profile,
                phone: normalizeIndianPhone(profile.phone),
            });
            setProfile(toProfileForm(saved));
            updateProfile(saved.name, saved.phone);
            showSuccess('Profile saved');
        } catch (error) {
            showError(getApiErrorMessage(
                error, 'Failed to save profile settings'
            ));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSystemSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!settings.companyName.trim()) {
            showError('Company name is required');
            return;
        }
        if (!Number.isInteger(settings.defaultLowStockThreshold)
                || settings.defaultLowStockThreshold < 0) {
            showError('Default low-stock threshold must be zero or greater');
            return;
        }
        const emailError = validateEmail(settings.contactEmail ?? '');
        const phoneError = validateIndianPhone(settings.contactPhone ?? '');
        setContactErrors({ email: emailError, phone: phoneError });
        if (emailError || phoneError) return;

        setSavingSettings(true);
        try {
            const saved = await settingsApi.update({
                ...settings,
                contactEmail: normalizeEmail(settings.contactEmail ?? ''),
                contactPhone: normalizeIndianPhone(
                    settings.contactPhone ?? ''
                ),
            });
            setSettings(saved);
            showSuccess('Company and inventory settings saved');
        } catch (error) {
            showError(getApiErrorMessage(
                error, 'Failed to save company settings'
            ));
        } finally {
            setSavingSettings(false);
        }
    };

    const handlePasswordSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const nextErrors: typeof passwordErrors = {};
        if (!passwordForm.currentPassword) {
            nextErrors.currentPassword = 'Current password is required.';
        }
        nextErrors.newPassword = validatePasswordStrength(
            passwordForm.newPassword
        );
        if (!passwordForm.confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your new password.';
        } else if (passwordForm.newPassword
                !== passwordForm.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }
        setPasswordErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setSavingPassword(true);
        try {
            await userApi.changeCurrentPassword(passwordForm);
            showSuccess(
                'Password changed. Sign in again with your new password.'
            );
            logout();
            navigate('/login', { replace: true });
        } catch (error) {
            showError(getApiErrorMessage(
                error, 'Failed to change your password'
            ));
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) return <PageLoader />;
    if (loadError) {
        return (
            <section className="card p-8 text-center">
                <p role="alert" className="text-sm text-rose-600">
                    {loadError}
                </p>
                <button type="button" className="btn-secondary mt-4"
                    onClick={retrySettingsLoad}>
                    Try again
                </button>
            </section>
        );
    }

    return (
        <>
            <PageHeader
                eyebrow={isAdmin ? 'Administration' : 'Account'}
                title="Profile & Settings"
                description="Manage your profile, password, and account settings."
            />

            <div className="grid gap-5 xl:grid-cols-2">
                <section className="card p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                            <UserRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Profile & notifications
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Update your account details.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit}
                        className="space-y-4" noValidate>
                        <div>
                            <label className="label" htmlFor="profile-name">
                                Full name
                            </label>
                            <input
                                id="profile-name"
                                value={profile.name}
                                onChange={event => setProfile(prev => ({
                                    ...prev,
                                    name: event.target.value,
                                }))}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="profile-phone">
                                Phone number
                            </label>
                            <input
                                id="profile-phone"
                                type="tel"
                                value={profile.phone}
                                onChange={event => setProfile(prev => ({
                                    ...prev,
                                    phone: event.target.value,
                                }))}
                                onInput={() =>
                                    setProfilePhoneError(undefined)}
                                className={`input ${profilePhoneError
                                    ? 'border-rose-500' : ''}`}
                                placeholder="9876543210"
                                autoComplete="tel"
                                aria-invalid={!!profilePhoneError}
                                aria-describedby={profilePhoneError
                                    ? 'profile-phone-error' : undefined}
                            />
                            {profilePhoneError && (
                                <p id="profile-phone-error" role="alert"
                                    className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                    {profilePhoneError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={savingProfile}
                            >
                                <Save className="w-4 h-4" />
                                {savingProfile ? 'Saving...' : 'Save profile'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="card p-5 sm:p-6">
                    <div className="mb-6 flex items-start gap-3">
                        <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Change password
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Verify your current password before choosing a new one.
                            </p>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordSubmit}
                        className="space-y-4" noValidate>
                        <PasswordField
                            id="current-password"
                            label="Current password"
                            value={passwordForm.currentPassword}
                            error={passwordErrors.currentPassword}
                            onChange={value => {
                                setPasswordForm(prev => ({
                                    ...prev, currentPassword: value,
                                }));
                                setPasswordErrors(prev => ({
                                    ...prev, currentPassword: undefined,
                                }));
                            }}
                            autoComplete="current-password"
                        />
                        <PasswordField
                            id="new-password"
                            label="New password"
                            value={passwordForm.newPassword}
                            error={passwordErrors.newPassword}
                            onChange={value => {
                                setPasswordForm(prev => ({
                                    ...prev, newPassword: value,
                                }));
                                setPasswordErrors(prev => ({
                                    ...prev, newPassword: undefined,
                                }));
                            }}
                            autoComplete="new-password"
                        />
                        <PasswordField
                            id="confirm-new-password"
                            label="Confirm new password"
                            value={passwordForm.confirmPassword}
                            error={passwordErrors.confirmPassword}
                            onChange={value => {
                                setPasswordForm(prev => ({
                                    ...prev, confirmPassword: value,
                                }));
                                setPasswordErrors(prev => ({
                                    ...prev, confirmPassword: undefined,
                                }));
                            }}
                            autoComplete="new-password"
                        />
                        <p className="text-xs leading-5 text-slate-400">
                            Use at least 8 characters, including a letter and a
                            number. This browser will sign out after the change;
                            tokens on other devices remain valid until they expire.
                        </p>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="btn-primary"
                                disabled={savingPassword}>
                                <Save className="h-4 w-4" />
                                {savingPassword
                                    ? 'Updating...'
                                    : 'Change password'}
                            </button>
                        </div>
                    </form>
                </section>

                {isAdmin && (settingsLoadError ? (
                    <section className="card p-6">
                        <p role="alert" className="text-sm text-rose-600">
                            Company settings could not be loaded: {settingsLoadError}
                        </p>
                        <button type="button" className="btn-secondary mt-4"
                            onClick={retrySettingsLoad}>
                            Try again
                        </button>
                    </section>
                ) : <section className="card p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Company & inventory defaults
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Configure organization details and the default low-stock threshold.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSystemSubmit}
                        className="space-y-4" noValidate>
                        <div>
                            <label className="label" htmlFor="company-name">
                                Company name
                            </label>
                            <input
                                id="company-name"
                                value={settings.companyName}
                                onChange={event => setSettings(prev => ({
                                    ...prev,
                                    companyName: event.target.value,
                                }))}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="company-email">
                                Contact email
                            </label>
                            <input
                                id="company-email"
                                type="email"
                                value={settings.contactEmail ?? ''}
                                onChange={event => setSettings(prev => ({
                                    ...prev,
                                    contactEmail: event.target.value,
                                }))}
                                onInput={() => setContactErrors(prev => ({
                                    ...prev, email: undefined,
                                }))}
                                className={`input ${contactErrors.email
                                    ? 'border-rose-500' : ''}`}
                                placeholder="example@gmail.com"
                                autoComplete="email"
                                aria-invalid={!!contactErrors.email}
                                aria-describedby={contactErrors.email
                                    ? 'company-email-error' : undefined}
                            />
                            {contactErrors.email && (
                                <p id="company-email-error" role="alert"
                                    className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                    {contactErrors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="label" htmlFor="company-phone">
                                Contact phone
                            </label>
                            <input
                                id="company-phone"
                                type="tel"
                                value={settings.contactPhone ?? ''}
                                onChange={event => setSettings(prev => ({
                                    ...prev,
                                    contactPhone: event.target.value,
                                }))}
                                onInput={() => setContactErrors(prev => ({
                                    ...prev, phone: undefined,
                                }))}
                                className={`input ${contactErrors.phone
                                    ? 'border-rose-500' : ''}`}
                                placeholder="9876543210"
                                autoComplete="tel"
                                aria-invalid={!!contactErrors.phone}
                                aria-describedby={contactErrors.phone
                                    ? 'company-phone-error' : undefined}
                            />
                            {contactErrors.phone && (
                                <p id="company-phone-error" role="alert"
                                    className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                    {contactErrors.phone}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="label" htmlFor="default-threshold">
                                Default low-stock threshold (units)
                            </label>
                            <div className="relative">
                                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="default-threshold"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={settings.defaultLowStockThreshold}
                                    onChange={event => setSettings(prev => ({
                                        ...prev,
                                        defaultLowStockThreshold:
                                            event.target.value === ''
                                                ? 0
                                                : Number(event.target.value),
                                    }))}
                                    className="input pl-9"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Used when a new stock record is created without an explicit threshold.
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={savingSettings}
                            >
                                <Save className="w-4 h-4" />
                                {savingSettings ? 'Saving...' : 'Save system settings'}
                            </button>
                        </div>
                    </form>
                </section>)}
            </div>
        </>
    );
}

function toProfileForm(user: User): UserProfileRequest {
    return {
        name: user.name,
        phone: user.phone ?? '',
    };
}

function PasswordField({
    id,
    label,
    value,
    error,
    onChange,
    autoComplete,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
    autoComplete: 'current-password' | 'new-password';
}) {
    return (
        <div>
            <label className="label" htmlFor={id}>{label}</label>
            <input
                id={id}
                type="password"
                autoComplete={autoComplete}
                className={`input ${error ? 'border-rose-500' : ''}`}
                value={value}
                onChange={event => onChange(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                required
            />
            {error && (
                <p id={`${id}-error`} role="alert"
                    className="mt-1 text-xs text-rose-600">
                    {error}
                </p>
            )}
        </div>
    );
}
