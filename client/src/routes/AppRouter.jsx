import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuthInitialization } from '../hooks/useAuthInitialization';

import NotFound from '../pages/NotFound';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import LoadingSpinner from '../pages/LodingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function AppRouter() {
    const { isInitialized } = useAuthInitialization();

    // Show loading spinner while initializing auth
    if (!isInitialized) {
        return <LoadingSpinner />;
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/signup" 
                element={
                    <PublicRoute>
                        <Signup />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
