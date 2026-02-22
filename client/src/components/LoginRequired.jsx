import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const LoginRequired = ({ children, title = "Access Restricted" }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  // If user is authenticated, show the protected content
  if (isAuthenticated && user) {
    return children;
  }

  // If user is in guest mode, show login required message
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body text-center p-5">
              <div className="mb-4">
                <i className="fas fa-lock fa-3x text-warning"></i>
              </div>
              <h3 className="card-title mb-3">{title}</h3>
              <p className="card-text text-muted mb-4">
                This feature requires a user account. Please log in to access advanced analytics,
                profile management, settings, and reminders.
              </p>
              <div className="d-grid gap-2">
                <Link to="/login" className="btn btn-primary btn-lg">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-outline-primary btn-lg">
                  <i className="fas fa-user-plus me-2"></i>
                  Sign Up
                </Link>
              </div>
              <div className="mt-4">
                <small className="text-muted">
                  Or continue using <Link to="/dashboard">Guest Mode</Link> for basic tracking
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRequired;