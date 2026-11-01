import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Bell, Save, UserRound } from 'lucide-react';
import { settingsApi } from '../api/settingsApi';
import { userApi } from '../api/userApi';
import { PageHeader } from '../components/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { getApiErrorMessage } from '../utils/apiError';
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
    companyName: 'SmartStock',
    contactEmail: '',
    contactPhone: '',
    defaultLowStockThreshold: 10,
};

export default function SettingsPage() {
    const { updateProfile } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [settings, setSettings] = useState(EMPTY_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [profilePhoneError, setProfilePhoneError] = useState<string>();
    const [contactErrors, setContactErrors] = useState<{
        email?: string;
        phone?: string;
    }>({});

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [currentUser, systemSettings] = await Promise.all([
                    userApi.getCurrentProfile(),
                    settingsApi.get(),
                ]);
                setProfile(toProfileForm(currentUser));
                setSettings(systemSettings);
            } catch (error) {
                showError(getApiErrorMessage(
                    error, 'Failed to load settings'
                ));
            } finally {
                setLoading(false);
            }
        };
        void loadSettings();
    }, [showError]);

    const handleProfileSubmit = async (event: FormEvent) => {
        event.preventDefault();
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

    if (loading) return <PageLoader />;

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Settings"
                description="Manage your profile, company details, and inventory defaults."
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
                </section>
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
