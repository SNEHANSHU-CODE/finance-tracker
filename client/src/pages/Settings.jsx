import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  FaCog,
  FaMobile,
  FaDesktop,
  FaSignOutAlt,
  FaSave,
  FaGlobe,
  FaDollarSign,
  FaPalette,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";
import { 
  updateUserPreferences, 
  fetchUserPreferences,
  resetUserPreferences,
  clearPreferencesError 
} from "../app/authSlice";

export default function Settings() {
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    preferences, 
    preferencesLoading, 
    preferencesError,
    user,
    isAuthenticated 
  } = useSelector((state) => state.auth);

  // Local state for form handling
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock active sessions (this would come from a sessions API)
  const activeSessions = [
    { 
      id: 1, 
      device: "Chrome on Windows", 
      location: "Bangalore, IND", 
      lastActive: "Active now", 
      current: true 
    },
    { 
      id: 2, 
      device: "Mobile App on Samsung", 
      location: "Bangalore, IND", 
      lastActive: "2 hours ago", 
      current: false 
    }
  ];

  // Update local preferences when Redux preferences change
  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  // Fetch preferences on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPreferences());
    }
  }, [dispatch, isAuthenticated]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handlePreferenceChange = (setting, value) => {
    const newPreferences = { ...localPreferences, [setting]: value };
    setLocalPreferences(newPreferences);
    
    // Check if there are changes from the original preferences
    const hasChangesNow = Object.keys(newPreferences).some(
      key => newPreferences[key] !== preferences[key]
    );
    setHasChanges(hasChangesNow);
  };

  const handleSavePreferences = async () => {
    if (!hasChanges) return;
    
    try {
      await dispatch(updateUserPreferences(localPreferences)).unwrap();
      setSaveSuccess(true);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleResetPreferences = async () => {
    if (window.confirm('Are you sure you want to reset all preferences to default values?')) {
      try {
        await dispatch(resetUserPreferences()).unwrap();
        setSaveSuccess(true);
      } catch (error) {
        console.error('Failed to reset preferences:', error);
      }
    }
  };

  const dismissError = () => {
    dispatch(clearPreferencesError());
  };

  if (!isAuthenticated) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <p className="text-muted">Please log in to access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="mb-4">
            <h2 className="h4 mb-2">Settings</h2>
            <p className="text-muted">Manage your account preferences and security settings</p>
          </div>

          {/* Error Alert */}
          {preferencesError && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              <FaExclamationTriangle className="me-2" />
              {preferencesError}
              <button 
                type="button" 
                className="btn-close" 
                onClick={dismissError}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Success Alert */}
          {saveSuccess && (
            <div className="alert alert-success fade show mb-4" role="alert">
              <FaCheck className="me-2" />
              Preferences saved successfully!
            </div>
          )}

          <div className="row g-4">
            {/* Main Content */}
            <div className="col-12">
              {/* Preferences Card */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 d-flex align-items-center">
                      <FaCog className="me-2" />
                      Application Preferences
                    </h5>
                    {hasChanges && (
                      <span className="badge bg-warning text-dark">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaDollarSign className="me-2" />
                        Currency
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="INR">Indian Rupee (INR)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="CAD">Canadian Dollar (CAD)</option>
                        <option value="AUD">Australian Dollar (AUD)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaGlobe className="me-2" />
                        Language
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.language}
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaPalette className="me-2" />
                        Theme
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={handleResetPreferences}
                      disabled={preferencesLoading}
                    >
                      Reset to Default
                    </button>
                    
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary d-flex align-items-center"
                        onClick={handleSavePreferences}
                        disabled={!hasChanges || preferencesLoading}
                      >
                        {preferencesLoading ? (
                          <>
                            <FaSpinner className="me-2 spinner-border spinner-border-sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="card shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                    <h5 className="mb-2 mb-sm-0 d-flex align-items-center">
                      <FaDesktop className="me-2" />
                      Active Sessions
                    </h5>
                    <button className="btn btn-outline-danger btn-sm d-flex align-items-center">
                      <FaSignOutAlt className="me-2" />
                      Sign Out All
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  {activeSessions.map((session, index) => (
                    <div key={session.id} className={`p-3 ${index !== activeSessions.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                            {session.device.includes('Mobile') ? 
                              <FaMobile className="text-info" /> : 
                              <FaDesktop className="text-info" />
                            }
                          </div>
                          <div>
                            <div className="fw-medium d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                              <span className="me-2">{session.device}</span>
                              {session.current && (
                                <span className="badge bg-success">Current</span>
                              )}
                            </div>
                            <small className="text-muted">
                              {session.location} • {session.lastActive}
                            </small>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="btn btn-outline-danger btn-sm">
                            <FaSignOutAlt />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Info Display (for debugging/verification) */}
              {user && (
                <div className="card shadow-sm mt-4">
                  <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">Current User Info</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Username:</strong> {user.username}
                      </div>
                      <div className="col-md-6">
                        <strong>Email:</strong> {user.email}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-12">
                        <strong>Current Preferences:</strong>
                        <ul className="list-unstyled mt-1 ms-3">
                          <li>Currency: {preferences.currency}</li>
                          <li>Language: {preferences.language}</li>
                          <li>Theme: {preferences.theme}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}