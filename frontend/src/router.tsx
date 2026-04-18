import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Suspense, lazy } from 'react';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const Suppliers = lazy(() => import('./pages/suppliers'));
const SuppliersEvaluation = lazy(() => import('./pages/suppliers-evaluation'));
const SupplierNew = lazy(() => import('./pages/suppliers/new'));
const Projects = lazy(() => import('./pages/projects'));
const Contracts = lazy(() => import('./pages/contracts'));
const Evaluations = lazy(() => import('./pages/evaluations'));
const EvaluationDetail = lazy(() => import('./pages/evaluations/detail'));
const Settings = lazy(() => import('./pages/settings'));
const UsersPage = lazy(() => import('./pages/system/users'));
const RolesPage = lazy(() => import('./pages/system/roles'));
const ConfigPage = lazy(() => import('./pages/system/config'));

import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/login';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: (
                    <MainLayout>
                        <Suspense fallback={<div className="p-8">Loading...</div>}>
                            <Outlet />
                        </Suspense>
                    </MainLayout>
                ),
                children: [
                    { path: 'dashboard', element: <Dashboard /> },
                    { path: 'suppliers', element: <Suppliers /> },
                    { path: 'suppliers-evaluation', element: <SuppliersEvaluation /> },
                    { path: 'suppliers/new', element: <SupplierNew /> },
                    { path: 'suppliers/:id', element: <SupplierNew /> },
                    { path: 'projects', element: <Projects /> },
                    { path: 'contracts', element: <Contracts /> },
                    { path: 'evaluations', element: <Evaluations /> },
                    { path: 'evaluations/:id', element: <EvaluationDetail /> },
                    { path: 'settings', element: <Settings /> },

                    // System Management Routes
                    { path: 'system/users', element: <UsersPage /> },
                    { path: 'system/roles', element: <RolesPage /> },
                    { path: 'system/config', element: <ConfigPage /> },

                    { path: '', element: <Dashboard /> }, // Default
                ]
            }
        ]
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
