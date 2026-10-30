import {
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { AuthState, Role } from '../types';
import { AuthContext, type AuthContextValue } from './authContextValue';

const TOKEN_KEY = 'smartstock_auth';

const emptyState: AuthState = {
    token: null,
    userId: null,
    role: null,
    warehouseId: null,
    name: null,
    phone: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>(() => {
        try {
            const raw = sessionStorage.getItem(TOKEN_KEY);
            if (raw) return JSON.parse(raw) as AuthState;
            localStorage.removeItem(TOKEN_KEY);
        } catch {
            sessionStorage.removeItem(TOKEN_KEY);
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch {
                // Storage may be unavailable in restricted browser contexts.
            }
        }
        return emptyState;
    });

    useEffect(() => {
        if (state.token) {
            sessionStorage.setItem(TOKEN_KEY, JSON.stringify(state));
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
        }
    }, [state]);

    const login = useCallback((
        token: string,
        userId: number,
        role: Role,
        warehouseId: number | null,
        name: string,
        phone: string
    ) => {
        const nextState = { token, userId, role, warehouseId, name, phone };
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify(nextState));
        setState(nextState);
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setState(emptyState);
    }, []);

    const updateProfile = useCallback((name: string, phone: string) => {
        setState(prev => ({ ...prev, name, phone }));
    }, []);

    const value: AuthContextValue = {
        ...state,
        login,
        updateProfile,
        logout,
        isAdmin:   state.role === 'ADMIN',
        isManager: state.role === 'WAREHOUSE_MGR',
        isViewer:  state.role === 'VIEWER',
        canMutate: state.role === 'ADMIN' ||
                   state.role === 'WAREHOUSE_MGR',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}