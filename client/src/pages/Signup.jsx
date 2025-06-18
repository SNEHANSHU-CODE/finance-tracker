import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { registerUser, clearError } from '../app/authSlice';

export default function Signup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    
    const [signup, setSignup] = useState({
        username: "",
        email: "",
        password: "",
        cpassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showCPassword, setShowCPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSignup((prev) => ({ ...prev, [name]: value }));
        // Clear field-specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        // Clear Redux error
        if (error) {
            dispatch(clearError());
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const toggleCPasswordVisibility = () => {
        setShowCPassword(prev => !prev);
    };

    const validate = () => {
        const newErrors = {};
        const nameRegex = /^[A-Za-z\s]{3,}$/;
        const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!signup.username.trim()) {
            newErrors.username = 'Username is required.';
        } else if (!nameRegex.test(signup.username)) {
            newErrors.username = 'Username should be at least 3 characters and contain only letters.';
        }

        if (!signup.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(signup.email)) {
            newErrors.email = 'Invalid email format.';
        }

        if (!signup.password) {
            newErrors.password = 'Password is required.';
        } else if (!passwordRegex.test(signup.password)) {
            newErrors.password = 'Password must be 8+ chars, with uppercase, lowercase, digit & special char.';
        }

        if (!signup.cpassword) {
            newErrors.cpassword = 'Please confirm your password.';
        } else if (signup.password !== signup.cpassword) {
            newErrors.cpassword = 'Passwords do not match.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            try {
                const userData = {
                    username: signup.username,
                    email: signup.email,
                    password: signup.password
                };
                await dispatch(registerUser(userData)).unwrap();
                navigate('/dashboard'); // Redirect after successful registration
            } catch (error) {
                console.error('Registration failed:', error);
            }
        }
    }

    return (
        <div className="container mt-5 mb-4" style={{ maxWidth: '500px' }}>
            <h3 className="mb-4 text-center">Sign Up</h3>
            <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                
                <div className="mb-3">
                    <label htmlFor='username' className="form-label">Username</label>
                    <input
                        type='text'
                        name='username'
                        id='username'
                        value={signup.username}
                        onChange={handleChange}
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        disabled={loading}
                    />
                    {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                </div>
                
                <div className="mb-3">
                    <label htmlFor='email' className="form-label">Email</label>
                    <input
                        type='email'
                        name='email'
                        id='email'
                        value={signup.email}
                        onChange={handleChange}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        disabled={loading}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                
                <div className="mb-3 position-relative">
                    <label htmlFor='password' className="form-label">Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        name='password'
                        id='password'
                        value={signup.password}
                        onChange={handleChange}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        disabled={loading}
                    />
                    <span
                        onClick={togglePasswordVisibility}
                        style={{ 
                            position: 'absolute', 
                            right: '10px', 
                            top: '35px', 
                            cursor: 'pointer',
                            zIndex: 5
                        }}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                
                <div className="mb-3 position-relative">
                    <label htmlFor='cpassword' className="form-label">Confirm Password</label>
                    <input
                        type={showCPassword ? "text" : "password"}
                        name='cpassword'
                        id='cpassword'
                        value={signup.cpassword}
                        onChange={handleChange}
                        className={`form-control ${errors.cpassword ? 'is-invalid' : ''}`}
                        autoComplete='off'
                        disabled={loading}
                    />
                    <span
                        onClick={toggleCPasswordVisibility}
                        style={{ 
                            position: 'absolute', 
                            right: '10px', 
                            top: '35px', 
                            cursor: 'pointer',
                            zIndex: 5
                        }}
                    >
                        {showCPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                    {errors.cpassword && <div className="invalid-feedback">{errors.cpassword}</div>}
                </div>
                
                <button 
                    className="btn btn-success w-100" 
                    type='submit'
                    disabled={loading}
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                
                <p className='mt-3 text-center'>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    )
}
