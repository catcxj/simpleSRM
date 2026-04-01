import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    name: string;
    permissions?: string[];
    role?: string | {
        name: string;
    };
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    hasPermission: (action: string, resource: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            login: (token, user) => set({ token, user, isAuthenticated: true }),
            logout: () => set({ token: null, user: null, isAuthenticated: false }),
            hasPermission: (action, resource) => {
                const user = get().user;
                if (!user || (!user.permissions && user.username !== 'admin')) return false;
                // If it's the admin, just allow everything for safety/fallback in this demo
                // Or you can strictly check permissions
                if (user.username === 'admin') return true;

                return user.permissions?.includes(`${action}:${resource}`) || false;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
