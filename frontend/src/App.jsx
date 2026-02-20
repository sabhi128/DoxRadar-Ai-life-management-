import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

import Loader from './components/Loader';

// Lazy load pages — each becomes a separate chunk, loaded only when navigated to
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const LifeAudit = lazy(() => import('./pages/LifeAudit'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Layout>{children}</Layout>;
};

const App = () => {
    return (
        <Router>
            <Toaster position="top-right" />
            <Suspense fallback={<Loader fullScreen={true} />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/documents"
                        element={
                            <ProtectedRoute>
                                <Documents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/subscriptions"
                        element={
                            <ProtectedRoute>
                                <Subscriptions />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/life-audit"
                        element={
                            <ProtectedRoute>
                                <LifeAudit />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
};

export default App;
