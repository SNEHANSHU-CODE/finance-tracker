import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail, MdLock, MdLogin } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { loginUser, clearFormError, clearOAuthError, migrateGuestData, setGuestMode } from '../app/authSlice';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, formError, oauthError } = useSelector((state) => state.auth);

    const [login, setLogin] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLogin((prev) => ({ ...prev, [name]: value }));
        // Clear field-specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        // Clear form error only
        if (formError) {
            dispatch(clearFormError());
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    }

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

        if (!login.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(login.email)) {
            newErrors.email = 'Invalid email format.';
        }

        if (!login.password) {
            newErrors.password = 'Password is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                await dispatch(loginUser(login)).unwrap();

                // Try to migrate guest data if any exists
                try {
                    await dispatch(migrateGuestData()).unwrap();
                } catch (migrationError) {
                    console.warn('Guest data migration failed:', migrationError);
                    // Don't block login if migration fails
                }

                navigate('/dashboard'); // Redirect to dashboard or home
            } catch (error) {
                console.error('Login failed:', error);
            }
        }
    }

    return (
        <div className="container-fluid py-4 d-flex align-items-center justify-content-center bg-light">
            <div className="row w-100 justify-content-center nav-top-margin">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4 col-xl-3">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-4">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <div className="mb-3">
                                    <MdLogin size={48} className="text-primary" />
                                </div>
                                <h4 className="card-title fw-bold">Welcome Back</h4>
                                <p className="text-muted small">
                                    Sign in to continue to your account
                                </p>
                            </div>

                            {/* Form Errors - Email/Password */}
                            {formError && (
                                <div className="alert alert-danger py-2 mb-3" role="alert">
                                    <strong>Login Error:</strong> {formError}
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit}>
                                {/* Email Input */}
                                <div className="mb-3">
                                    <label htmlFor='email' className="form-label fw-semibold">
                                        Email Address
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light">
                                            <MdEmail className="text-muted" />
                                        </span>
                                        <input
                                            type='email'
                                            name='email'
                                            id="email"
                                            autoComplete='username'
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="Enter your email"
                                            value={login.email}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <div className="invalid-feedback d-block">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div className="mb-3">
                                    <label htmlFor='password' className="form-label fw-semibold">
                                        Password
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light">
                                            <MdLock className="text-muted" />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name='password'
                                            id='password'
                                            autoComplete="current-password"
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            placeholder="Enter your password"
                                            value={login.password}
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={togglePasswordVisibility}
                                            disabled={loading}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="invalid-feedback d-block">
                                            {errors.password}
                                        </div>
                                    )}
                                </div>

                                {/* Forgot Password Link */}
                                <div className="text-end mb-3">
                                    <Link to="/resetpassword" className="text-decoration-none small">
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <button
                                    className="btn btn-primary w-100 py-2"
                                    type='submit'
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="d-flex align-items-center my-3">
                                <hr className="flex-grow-1" />
                                <span className="mx-2 text-muted small">or</span>
                                <hr className="flex-grow-1" />
                            </div>

                            {/* Google OAuth & Guest Options */}
                            <div className="d-grid gap-2 mb-3">
                                <GoogleLoginButton className="btn-outline-secondary w-100" />
                                <button
                                    className="btn btn-outline-secondary w-100"
                                    type='button'
                                    onClick={() => {
                                        dispatch(setGuestMode());
                                        navigate('/dashboard');
                                    }}
                                    disabled={loading}
                                >
                                    Continue as Guest
                                </button>
                            </div>

                            {/* OAuth Errors - Google Sign In */}
                            {oauthError && (
                                <div className="alert alert-warning py-2 mb-3" role="alert">
                                    <strong>OAuth Error:</strong> {oauthError}
                                </div>
                            )}

                            {/* Sign Up Link */}
                            <div className="text-center mt-3">
                                <p className='text-muted small mb-0'>
                                    Don't have an account?{' '}
                                    <Link to="/signup" className="text-decoration-none fw-semibold">
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}