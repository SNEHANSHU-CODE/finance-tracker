import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { loginUser, clearError } from '../app/authSlice';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    
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
        // Clear Redux error
        if (error) {
            dispatch(clearError());
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
                navigate('/dashboard'); // Redirect to dashboard or home
            } catch (error) {
                console.error('Login failed:', error);
            }
        }
    }

    return (
        <div className="container mt-5 mb-4" style={{ maxWidth: '500px' }}>
            <h3 className="mb-4 text-center">Login</h3>
            <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                
                <div className="mb-3">
                    <label htmlFor='email' className="form-label">Email</label>
                    <input
                        type='email'
                        name='email'
                        id="email"
                        autoComplete='email'
                        value={login.email}
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
                        autoComplete="current-password"
                        value={login.password}
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
                
                <button 
                    className="btn btn-success w-100" 
                    type='submit'
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                
                <p className='mt-3 text-center'>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>

                <p className='mt-3 text-center'>
                    Forget password? <Link to="/resetpassword">Reset password</Link>
                </p>
            </form>
        </div>
    )
}
