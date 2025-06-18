import React, { useState } from "react";
import { 
  FaCog,
  FaMobile,
  FaDesktop,
  FaSignOutAlt,
  FaSave,
  FaGlobe,
  FaDollarSign,
  FaPalette
} from "react-icons/fa";

export default function Settings() {
  const [preferences, setPreferences] = useState({
    currency: "USD",
    language: "en",
    theme: "light"
  });

  const handlePreferenceChange = (setting, value) => {
    setPreferences(prev => ({ ...prev, [setting]: value }));
  };

  const activeSessions = [
    { id: 1, device: "Chrome on Windows", location: "Bangalore, IND", lastActive: "Active now", current: true },
    { id: 2, device: "Mobile App on Samsung", location: "Bangalore, IND", lastActive: "2 hours ago", current: false }
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="mb-4">
            <h2 className="h4 mb-2">Settings</h2>
            <p className="text-muted">Manage your account preferences and security settings</p>
          </div>

          <div className="row g-4">
            {/* Main Content */}
            <div className="col-12">
              {/* Preferences Card */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaCog className="me-2" />
                    Application Preferences
                  </h5>
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
                        value={preferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
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
                        value={preferences.language}
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="en">Hindi</option>
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
                        value={preferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button className="btn btn-primary d-flex align-items-center">
                      <FaSave className="me-2" />
                      Save Preferences
                    </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}