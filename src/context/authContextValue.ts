import { createContext } from 'react';
import type { AuthState, Role } from '../types';

export interface AuthContextValue extends AuthState {
    login: (
        token: string,
        userId: number,
        role: Role,
        warehouseId: number | null,
        name: string,
        phone: string
    ) => void;
    updateProfile: (name: string, phone: string) => void;
    logout: () => void;
    isAdmin: boolean;
    isManager: boolean;
    isViewer: boolean;
    canMutate: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);
