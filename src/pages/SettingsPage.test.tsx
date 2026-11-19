import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SettingsPage from './SettingsPage';

const mocks = vi.hoisted(() => ({
    getCurrentProfile: vi.fn(),
    changeCurrentPassword: vi.fn(),
    updateCurrentProfile: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/userApi', () => ({
    userApi: {
        getCurrentProfile: mocks.getCurrentProfile,
        changeCurrentPassword: mocks.changeCurrentPassword,
        updateCurrentProfile: mocks.updateCurrentProfile,
    },
}));
vi.mock('../api/settingsApi', () => ({
    settingsApi: { get: vi.fn(), update: vi.fn() },
}));
vi.mock('../context/useAuth', () => ({
    useAuth: () => ({
        updateProfile: mocks.updateProfile,
        isAdmin: false,
        logout: mocks.logout,
    }),
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));

function renderSettingsPage() {
    return render(
        <MemoryRouter initialEntries={['/settings']}>
            <Routes>
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<p>Login page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('SettingsPage password changes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getCurrentProfile.mockResolvedValue({
            id: 8,
            name: 'Viewer User',
            email: 'viewer@example.com',
            role: 'VIEWER',
            warehouseId: null,
            phone: '',
        });
        mocks.changeCurrentPassword.mockResolvedValue(undefined);
    });

    it('blocks mismatched password confirmation', async () => {
        const user = userEvent.setup();
        renderSettingsPage();

        await user.type(await screen.findByLabelText('Current password'), 'OldPass123');
        await user.type(screen.getByLabelText('New password'), 'NewPass123');
        await user.type(screen.getByLabelText('Confirm new password'), 'OtherPass123');
        await user.click(screen.getByRole('button', { name: 'Change password' }));

        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
        expect(mocks.changeCurrentPassword).not.toHaveBeenCalled();
    });

    it('changes only the current user password and signs out this browser', async () => {
        const user = userEvent.setup();
        renderSettingsPage();

        await user.type(await screen.findByLabelText('Current password'), 'OldPass123');
        await user.type(screen.getByLabelText('New password'), 'NewPass123');
        await user.type(screen.getByLabelText('Confirm new password'), 'NewPass123');
        await user.click(screen.getByRole('button', { name: 'Change password' }));

        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(mocks.changeCurrentPassword).toHaveBeenCalledWith({
            currentPassword: 'OldPass123',
            newPassword: 'NewPass123',
            confirmPassword: 'NewPass123',
        });
        expect(mocks.logout).toHaveBeenCalledOnce();
    });

    it('offers retry instead of leaving a profile failure loading', async () => {
        const user = userEvent.setup();
        mocks.getCurrentProfile
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({
                id: 8,
                name: 'Viewer User',
                email: 'viewer@example.com',
                role: 'VIEWER',
                warehouseId: null,
                phone: '',
            });
        renderSettingsPage();

        expect(await screen.findByText('Failed to load your profile'))
            .toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('heading', { name: 'Change password' }))
            .toBeInTheDocument();
    });
});
