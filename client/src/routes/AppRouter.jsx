import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuthInitialization } from '../hooks/useAuthInitialization';

import NotFound from '../components/NotFound';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import OAuthCallback from '../pages/OAuthCallback'; 
import LandingPage from '../pages/LandingPage';
import DashboardHome from '../pages/DashboardHome';
import LoadingSpinner from '../components/LodingSpinner';
import ResetPassword from '../components/ResetPassword';
import DevelopersNote from '../components/DevelopersNote';
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsOfService from '../components/TermOfService';


//Importing Dashboard Sub-Component
import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Analytics from '../pages/Analytics';
import Goals from '../pages/Goals';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Reminders from '../pages/Reminders';

// Protected Route Component
const ProtectedRoute = ({ children, guestAllowed = false }) => {
    const { isAuthenticated, isGuest } = useSelector((state) => state.auth);
    return (isAuthenticated && (!guestAllowed || !isGuest)) || (isGuest && guestAllowed) ? children : <Navigate to="/login" replace />;
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
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/oauth/callback" element={<PublicRoute><OAuthCallback /></PublicRoute>} />
            <Route path="/resetpassword" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/service" element={<TermsOfService />} />
            <Route path="/developersnote" element={<DevelopersNote />} />

            {/* Dashboard routes */}
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute guestAllowed={true}>
                        <DashboardHome />
                    </ProtectedRoute>
                } 
            >
                <Route index element={<Dashboard />} />

                {/* Nested routes */}
                <Route path="transactions" element={<Transactions />} />
                <Route path="analytics" element={
                    <ProtectedRoute guestAllowed={false}>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="goals" element={<Goals />} />
                <Route path="reminders" element={
                    <ProtectedRoute guestAllowed={false}>
                        <Reminders />
                    </ProtectedRoute>
                } />
                <Route path="settings" element={
                    <ProtectedRoute guestAllowed={false}>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="profile" element={
                    <ProtectedRoute guestAllowed={false}>
                        <Profile />
                    </ProtectedRoute>
                } />
                {/* Redirect unknown dashboard routes to main dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
