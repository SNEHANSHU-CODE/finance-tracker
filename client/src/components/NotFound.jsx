import React from 'react';
import './styles/NotFound.css';
import { useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaExclamationTriangle,
  FaArrowLeft
} from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <div className="min-vh-100 d-flex align-items-center bg-light nav-top-margin">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-6">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mb-4">
                  <FaExclamationTriangle
                    className="text-warning"
                    style={{ fontSize: '4rem' }}
                    aria-label="Warning icon"
                  />
                </div>

                {/* 404 Heading */}
                <h1 className="display-1 fw-bold text-primary mb-3">
                  404
                </h1>

                {/* Main Error Message */}
                <h2 className="h3 fw-semibold text-dark mb-3">
                  Oops! Page Not Found
                </h2>

                {/* Description */}
                <p className="lead text-muted mb-4 px-md-5">
                  The page you're looking for doesn't exist or has been moved.
                  Don't worry, it happens to the best of us.
                </p>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-5">
                  <button
                    onClick={handleGoHome}
                    className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2"
                    aria-label="Go to homepage"
                  >
                    <FaHome />
                    Go to Homepage
                  </button>

                  <button
                    onClick={handleGoBack}
                    className="btn btn-outline-secondary btn-lg d-flex align-items-center justify-content-center gap-2"
                    aria-label="Go back to previous page"
                  >
                    <FaArrowLeft />
                    Go Back
                  </button>
                </div>

                {/* Error Code for Support */}
                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    Error Code: 404 |
                    <span className="ms-1">
                      If you believe this is a mistake, please contact our support team.
                    </span>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
