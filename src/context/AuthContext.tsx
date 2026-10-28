import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { AuthState, Role } from '../types';

const TOKEN_KEY = 'smartstock_auth';

interface AuthContextValue extends AuthState {
    login: (
        token: string,
        userId: number,
        role: Role,
        warehouseId: number | null,
        name: string,
        phone: string
    ) => void;
    logout: () => void;
    isAdmin: boolean;
    isManager: boolean;
    isViewer: boolean;
    canMutate: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
            const raw = localStorage.getItem(TOKEN_KEY);
            if (raw) return JSON.parse(raw) as AuthState;
        } catch {
            localStorage.removeItem(TOKEN_KEY);
        }
        return emptyState;
    });

    useEffect(() => {
        if (state.token) {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(state));
        } else {
            localStorage.removeItem(TOKEN_KEY);
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
        setState({ token, userId, role, warehouseId, name, phone });
    }, []);

    const logout = useCallback(() => {
        setState(emptyState);
    }, []);

    const value: AuthContextValue = {
        ...state,
        login,
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

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error(
        'useAuth must be used within AuthProvider'
    );
    return ctx;
}