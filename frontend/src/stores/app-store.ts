import { create } from 'zustand'

interface AppState {
    theme: 'light' | 'dark'
    toggleTheme: () => void
    sidebarOpen: boolean
    toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
    theme: 'light',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
