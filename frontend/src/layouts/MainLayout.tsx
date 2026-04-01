import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const NavItem = ({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary font-medium"
            )
        }
    >
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {label}
        </div>
        {badge !== undefined && badge > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
                {badge}
            </span>
        )}
    </NavLink>
);

const Sidebar = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuthStore();

    const { data: countData } = useQuery({
        queryKey: ['evaluations', 'pending-count'],
        queryFn: () => api.get('/evaluations/pending-count').then((res: any) => ({ count: res.data })),
        refetchInterval: 30000 // Refetch every 30s
    });

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <NavItem to="/dashboard" icon={LayoutDashboard} label={t('app.dashboard')} />

            {hasPermission('read', 'suppliers') && <NavItem to="/suppliers" icon={Users} label={t('app.suppliers')} />}
            {hasPermission('read', 'projects') && <NavItem to="/projects" icon={FileText} label={t('app.projects')} />}
            {hasPermission('read', 'contracts') && <NavItem to="/contracts" icon={FileText} label={t('app.contracts')} />}
            {hasPermission('read', 'evaluations') && <NavItem to="/evaluations" icon={BarChart3} label={t('app.evaluation')} badge={countData?.count} />}

            <div className="my-2 border-t" />
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('app.system_management')}
            </div>
            {hasPermission('read', 'users') && <NavItem to="/system/users" icon={Users} label={t('app.users')} />}
            {hasPermission('read', 'roles') && <NavItem to="/system/roles" icon={FileText} label={t('app.roles')} />}
            {hasPermission('read', 'config') && <NavItem to="/system/config" icon={Settings} label={t('app.configuration')} />}
        </nav>
    );
};

import { useAuthStore } from '@/store/authStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuthStore(); // This should be working as it is using the hook

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar for Desktop */}
            <div className="hidden border-r bg-muted/40 md:block min-h-screen">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <NavLink to="/" className="flex items-center gap-2 font-semibold">
                        <span className="">{t('app.system_name')}</span>
                    </NavLink>
                </div>
                <div className="flex-1 py-2">
                    <Sidebar />
                </div>
            </div>

            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <NavLink to="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                                    {t('app.system_name')}
                                </NavLink>
                                <Sidebar />
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Header Content/Breadcrumbs/Search */}
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.username}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>{t('app.settings')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    useAuthStore.getState().logout();
                                    // navigate('/login'); // authStore might handle or we do it here. 
                                    // Actually checking authStore, it just clears state. We need to redirect.
                                    window.location.href = '/login';
                                }}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t('app.logout')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
