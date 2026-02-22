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
  clearPreferencesError,
  fetchActiveSessions,
  terminateSessionAction,
  terminateAllSessionsAction
} from "../app/authSlice";
import SessionInfo from "../components/SessionInfo";
import { usePreferences } from "../hooks/usePreferences";

export default function Settings() {
  const dispatch = useDispatch();
  const { t } = usePreferences();
  
  // Redux state
  const { 
    preferences, 
    preferencesLoading, 
    preferencesError,
    user,
    isAuthenticated,
    sessions,
    sessionsLoading,
    sessionsError
  } = useSelector((state) => state.auth);

  // Local state for form handling
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch sessions on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchActiveSessions());
    }
  }, [dispatch, isAuthenticated]);

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
      console.log('=== SAVE PREFERENCES DEBUG ===');
      console.log('Local preferences to send:', JSON.stringify(localPreferences, null, 2));
      console.log('Current Redux preferences:', JSON.stringify(preferences, null, 2));
      console.log('User ID from state:', user?._id);
      
      const result = await dispatch(updateUserPreferences(localPreferences)).unwrap();
      console.log('Save preferences result:', result);
      
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', {
        errorMessage: error,
        errorType: typeof error,
        errorDetails: error?.message || error?.data || error
      });
    }
  };

  const handleResetPreferences = async () => {
    if (window.confirm(t('reset_to_default') + '?')) {
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
            <p className="text-muted">{t('login')} {t('settings')}</p>
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
            <h2 className="h4 mb-2">{t('settings')}</h2>
            <p className="text-muted">{t('manage_prefs_desc')}</p>
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
              {t('save_preferences')}
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
                      {t('settings')}
                    </h5>
                    {hasChanges && (
                      <span className="badge bg-warning text-dark">
                        {t('unsaved_changes')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaDollarSign className="me-2" />
                        {t('currency')}
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="INR">{t('inr')}</option>
                        <option value="USD">{t('usd')}</option>
                        <option value="EUR">{t('eur')}</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="CAD">Canadian Dollar (CAD)</option>
                        <option value="AUD">Australian Dollar (AUD)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaGlobe className="me-2" />
                        {t('language')}
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.language}
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="en">{t('english')}</option>
                        <option value="hi">{t('hindi')}</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                        <option value="it">Italiano</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center">
                        <FaPalette className="me-2" />
                        {t('theme')}
                      </label>
                      <select
                        className="form-select"
                        value={localPreferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        disabled={preferencesLoading}
                      >
                        <option value="light">{t('light')}</option>
                        <option value="dark">{t('dark')}</option>
                        <option value="auto">{t('auto')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={handleResetPreferences}
                      disabled={preferencesLoading}
                    >
                      {t('reset_to_default')}
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
                            {t('saving')}
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            {t('save_preferences')}
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
                    <div className="d-flex align-items-center gap-2">
                        <h5 className="mb-0 d-flex align-items-center">
                        <FaDesktop className="me-2" />
                          {t('active_sessions')}
                      </h5>
                      <SessionInfo />
                    </div>
                    {sessions.length > 1 && (
                      <button 
                        className="btn btn-outline-danger btn-sm d-flex align-items-center"
                        onClick={() => dispatch(terminateAllSessionsAction())}
                        disabled={sessionsLoading}
                      >
                        <FaSignOutAlt className="me-2" />
                          {sessionsLoading ? t('signing_out') : t('sign_out_all')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body p-0">
                  {sessionsLoading && !sessions.length ? (
                    <div className="p-3 text-center">
                      <FaSpinner className="spinner-border me-2" />
                        {t('loading_sessions')}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-3 text-center text-muted">
                      {t('no_active_sessions')}
                    </div>
                  ) : (
                    sessions.map((session, index) => (
                      <div key={session._id} className={`p-3 ${index !== sessions.length - 1 ? 'border-bottom' : ''}`}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                          <div className="d-flex align-items-center mb-2 mb-sm-0">
                            <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                              {session.device?.toLowerCase().includes('mobile') ? 
                                <FaMobile className="text-info" /> : 
                                <FaDesktop className="text-info" />
                              }
                            </div>
                            <div>
                              <div className="fw-medium d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                                  <span className="me-2">{session.device || t('unknown_device')}</span>
                                {session.isCurrent && (
                                    <span className="badge bg-success">{t('current')}</span>
                                )}
                              </div>
                              <small className="text-muted">
                                  {session.location || t('location_unknown')} • {session.lastActive || t('just_now')}
                              </small>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => dispatch(terminateSessionAction(session._id))}
                              disabled={sessionsLoading}
                            >
                              <FaSignOutAlt />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* User Info Display (for debugging/verification) */}
              {user && (
                <div className="card shadow-sm mt-4">
                  <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">{t('current_user_info')}</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>{t('username')}:</strong> {user.username}
                      </div>
                      <div className="col-md-6">
                        <strong>{t('email')}:</strong> {user.email}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-12">
                        <strong>{t('current_preferences')}:</strong>
                        <ul className="list-unstyled mt-1 ms-3">
                          <li>{t('currency')}: {preferences.currency}</li>
                          <li>{t('language')}: {preferences.language}</li>
                          <li>{t('theme')}: {preferences.theme}</li>
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