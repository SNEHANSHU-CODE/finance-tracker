import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/authSlice';

export default function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get auth state from Redux store
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const toggleNavbar = () => setIsNavOpen(prev => !prev);
  const closeNavbar = () => setIsNavOpen(false);

  // Handle logout using Redux thunk
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      closeNavbar();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, Redux state will be cleared
      closeNavbar();
      navigate('/');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg bg-light shadow-sm py-3 position-sticky top-0 z-3">
      <div className="container">
        {/* Logo */}
        <Link 
          className="navbar-brand fw-bold text-primary" 
          to="/" 
          onClick={closeNavbar}
        >
          Finance Tracker
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-controls="navbarContent"
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div 
          className={`collapse navbar-collapse justify-content-end ${isNavOpen ? 'show' : ''}`} 
          id="navbarContent"
        >
          <ul className="navbar-nav gap-3 align-items-lg-center">
            {isAuthenticated ? (
              // Authenticated user menu
              <>
                <li className="nav-item">
                  <Link 
                    className="nav-link fw-medium text-dark" 
                    to="/dashboard" 
                    onClick={closeNavbar}
                  >
                    Dashboard
                  </Link>
                </li>
                {user && (
                  <li className="nav-item">
                    <span className="nav-link text-muted">
                      Welcome, {user.email || user.name || 'User'}
                    </span>
                  </li>
                )}
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </button>
                </li>
              </>
            ) : (
              // Guest user menu (not authenticated)
              <>
                <li className="nav-item">
                  <Link 
                    className="nav-link fw-medium text-dark" 
                    to="/login" 
                    onClick={closeNavbar}
                  >
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="nav-link fw-medium text-dark" 
                    to="/signup" 
                    onClick={closeNavbar}
                  >
                    Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
