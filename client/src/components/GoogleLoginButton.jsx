import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { authService } from '../services/authService';

export default function GoogleLoginButton({ className = '', text = 'Continue with Google' }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');

            // Get the OAuth URL from backend
            const response = await authService.startGoogleOAuth();
            
            if (response.authUrl) {
                // Redirect to Google OAuth
                window.location.href = response.authUrl;
            } else {
                throw new Error('Failed to get OAuth URL');
            }
        } catch (err) {
            console.error('Google OAuth error:', err);
            setError(err.message || 'Failed to initiate Google Sign-In');
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`btn d-flex align-items-center justify-content-center gap-2 ${className}`}
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                <FcGoogle size={20} />
                <span>{loading ? 'Connecting...' : text}</span>
            </button>
            {error && (
                <div className="alert alert-danger py-2 mt-2 mb-0 small" role="alert">
                    {error}
                </div>
            )}
        </>
    );
}
