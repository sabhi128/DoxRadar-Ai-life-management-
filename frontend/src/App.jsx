import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Subscriptions from './pages/Subscriptions';
import LifeAudit from './pages/LifeAudit';
import Layout from './components/Layout';

// Simple protected route wrapper
const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem('user');
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Layout>{children}</Layout>;
};

const App = () => {
    return (
        <Router>
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
        </Router>
    );
};

export default App;
