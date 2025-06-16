import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, clearCredentials } from '../app/authSlice';

export default function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get auth state from Redux store
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const toggleNavbar = () => setIsNavOpen(prev => !prev);
  const closeNavbar = () => setIsNavOpen(false);

  // Handle logout 
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    setIsLoggingOut(true);
    closeNavbar();
    
    try {
      // Attempt to logout via API
      await dispatch(logoutUser()).unwrap();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Even if API logout fails, clear local state
      dispatch(clearCredentials());
    } finally {
      setIsLoggingOut(false);
      // Always navigate to home after logout attempt
      navigate('/', { replace: true });
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
                      Welcome, {user.email || user.name || user.username || 'User'}
                    </span>
                  </li>
                )}
                <li className="nav-item">
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                    disabled={loading || isLoggingOut}
                  >
                    {(loading || isLoggingOut) ? (
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
