import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './RegisterPage';

const mocks = vi.hoisted(() => ({
    register: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
    authApi: { register: mocks.register },
}));
vi.mock('../context/useAuth', () => ({
    useAuth: () => ({ token: null }),
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));

function renderRegisterPage() {
    return render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<p>Login page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('RegisterPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('validates required fields before making a registration request', async () => {
        const user = userEvent.setup();
        renderRegisterPage();

        await user.click(screen.getByRole('button', { name: 'Create account' }));

        expect(screen.getByText('Full name is required.')).toBeInTheDocument();
        expect(screen.getByText('Email is required.')).toBeInTheDocument();
        expect(mocks.register).not.toHaveBeenCalled();
    });

    it('navigates to Login after successful registration', async () => {
        const user = userEvent.setup();
        mocks.register.mockResolvedValue({ email: 'new@example.com' });
        renderRegisterPage();

        await user.type(screen.getByLabelText('Full name'), 'New User');
        await user.type(screen.getByLabelText('Email address'), 'NEW@example.com');
        await user.type(
            screen.getByLabelText(/Use at least 8 characters/),
            'GoodsPilot123'
        );
        await user.type(screen.getByLabelText('Confirm password'), 'GoodsPilot123');
        await user.click(screen.getByRole('button', { name: 'Create account' }));

        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(mocks.register).toHaveBeenCalledWith({
            name: 'New User',
            email: 'new@example.com',
            phone: '',
            password: 'GoodsPilot123',
        });
        expect(mocks.showSuccess).toHaveBeenCalled();
    });

    it('surfaces registration API failures', async () => {
        const user = userEvent.setup();
        mocks.register.mockRejectedValue(new Error('request failed'));
        renderRegisterPage();

        await user.type(screen.getByLabelText('Full name'), 'New User');
        await user.type(screen.getByLabelText('Email address'), 'new@example.com');
        await user.type(
            screen.getByLabelText(/Use at least 8 characters/),
            'GoodsPilot123'
        );
        await user.type(screen.getByLabelText('Confirm password'), 'GoodsPilot123');
        await user.click(screen.getByRole('button', { name: 'Create account' }));

        expect(mocks.showError).toHaveBeenCalledWith(
            'Could not create your account. Please try again.'
        );
    });

    it('provides navigation back to Login', async () => {
        const user = userEvent.setup();
        renderRegisterPage();

        await user.click(screen.getByRole('link', { name: 'Sign in' }));

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });
});
