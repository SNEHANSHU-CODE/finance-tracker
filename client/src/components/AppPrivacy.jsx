import React from 'react';
import { FaShieldAlt, FaCalendarAlt, FaDollarSign, FaLock, FaUserShield, FaEnvelope } from 'react-icons/fa';

const AppPrivacy = () => {
  return (
    <div className="container-fluid bg-light min-vh-100 nav-top-margin">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header */}
            <div className="text-center mb-5">
              <FaShieldAlt className="text-primary mb-3" size={60} />
              <h1 className="display-4 fw-bold text-dark mb-3">Privacy Policy</h1>
              <p className="lead text-muted">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <div className="bg-primary text-white px-3 py-2 rounded-pill d-inline-block">
                <small><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</small>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
              
              {/* Introduction */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaUserShield className="text-primary me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Introduction</h2>
                </div>
                <p className="text-muted lh-lg">
                  ArthFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our finance tracking application that integrates with Google Calendar to help you manage your financial activities.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaCalendarAlt className="text-success me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Information We Collect</h2>
                </div>
                
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="border-start border-primary border-4 ps-3">
                      <h4 className="h5 text-dark">Google Account Information</h4>
                      <ul className="text-muted">
                        <li>Email address</li>
                        <li>Profile information (name, profile picture)</li>
                        <li>Google Calendar events and data</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-start border-success border-4 ps-3">
                      <h4 className="h5 text-dark">Financial Data</h4>
                      <ul className="text-muted">
                        <li>Expense and income records</li>
                        <li>Budget information</li>
                        <li>Financial categories and tags</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-start border-warning border-4 ps-3">
                      <h4 className="h5 text-dark">Uploaded Documents (Vault)</h4>
                      <ul className="text-muted">
                        <li>PDF bank statements you upload</li>
                        <li>CSV and Excel financial files</li>
                        <li>Document embeddings for AI search (stored securely)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border-start border-info border-4 ps-3">
                      <h4 className="h5 text-dark">AI Chat Data</h4>
                      <ul className="text-muted">
                        <li>Chat messages submitted to the AI assistant</li>
                        <li>Message ratings (upvote/downvote for quality improvement)</li>
                        <li>Session context used to personalize AI responses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaDollarSign className="text-warning me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">How We Use Your Information</h2>
                </div>
                
                <div className="bg-light rounded-3 p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-primary rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaCalendarAlt className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">Calendar Integration</h5>
                          <small className="text-muted">Sync financial events with your Google Calendar for better expense tracking</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-success rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaDollarSign className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">Financial Analysis</h5>
                          <small className="text-muted">Provide insights and analytics on your spending patterns</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-warning rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaUserShield className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">Account Management</h5>
                          <small className="text-muted">Maintain your account and provide customer support</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-info rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaLock className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">Service Improvement</h5>
                          <small className="text-muted">Enhance our application features and user experience</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-secondary rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaShieldAlt className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">AI-Powered Insights</h5>
                          <small className="text-muted">Process your financial data to power the AI Assistant's personalised responses. PII is masked before any data is sent to third-party AI providers.</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-danger rounded-circle me-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                          <FaLock className="text-white" size={16} />
                        </div>
                        <div>
                          <h5 className="h6 text-dark mb-1">Document Processing (Vault)</h5>
                          <small className="text-muted">Parse and embed uploaded financial documents to enable AI-driven document search and insights.</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaLock className="text-danger me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Data Security</h2>
                </div>
                <div className="alert alert-info border-0 bg-light-blue">
                  <p className="mb-2 text-dark fw-semibold">We implement industry-standard security measures:</p>
                  <ul className="text-muted mb-0">
                    <li>End-to-end encryption for data transmission</li>
                    <li>Secure server infrastructure with regular security updates</li>
                    <li>Limited access controls and authentication protocols</li>
                    <li>Regular security audits and vulnerability assessments</li>
                  </ul>
                </div>
              </section>

              {/* Data Sharing */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaUserShield className="text-info me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Data Sharing and Disclosure</h2>
                </div>
                <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 p-4">
                  <h4 className="h5 text-danger mb-3">We DO NOT sell your personal information</h4>
                  <p className="text-muted mb-3">We may only share your information in these limited circumstances:</p>
                  <ul className="text-muted">
                    <li><strong>With your consent:</strong> When you explicitly authorize us to share specific information</li>
                    <li><strong>Legal requirements:</strong> When required by law, court order, or government request</li>
                    <li><strong>Service providers:</strong> With trusted third-party services that help us operate our application</li>
                    <li><strong>Third-Party AI Providers (Groq &amp; Google Gemini):</strong> When you use the AI Assistant, your query and relevant financial context are sent to Groq or Google Gemini to generate a response. <strong>All Personally Identifiable Information (PII) is automatically masked and removed before transmission.</strong> Raw account numbers, full names, and sensitive identifiers are never shared with these providers.</li>
                  </ul>
                </div>
              </section>

              {/* Your Rights */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaShieldAlt className="text-success me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Your Rights and Choices</h2>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded-3">
                      <FaUserShield className="text-primary mb-2" size={32} />
                      <h5 className="h6 text-dark">Access & Update</h5>
                      <small className="text-muted">View and modify your personal information</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded-3">
                      <FaLock className="text-warning mb-2" size={32} />
                      <h5 className="h6 text-dark">Data Portability</h5>
                      <small className="text-muted">Export your data in a usable format</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded-3">
                      <FaShieldAlt className="text-danger mb-2" size={32} />
                      <h5 className="h6 text-dark">Account Deletion</h5>
                      <small className="text-muted">Delete your account and associated data</small>
                    </div>
                  </div>
                </div>
              </section>

              {/* Google Calendar Specific */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <FaCalendarAlt className="text-primary me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Google Calendar Integration</h2>
                </div>
                <div className="border border-primary border-opacity-25 rounded-3 p-4 bg-primary bg-opacity-5">
                  <h4 className="h5 text-primary mb-3">Calendar Data Usage</h4>
                  <ul className="text-muted mb-3">
                    <li>We only access calendar events you explicitly choose to sync with our application</li>
                    <li>Calendar data is used solely for expense tracking and financial planning purposes</li>
                    <li>You can revoke calendar access at any time through your Google Account settings</li>
                    <li>We comply with Google's API Services User Data Policy</li>
                  </ul>
                  <div className="alert alert-primary border-0 mb-0">
                    <small className="mb-0">
                      <strong>Note:</strong> You can manage your Google Calendar permissions by visiting your 
                      <a href="https://myaccount.google.com/permissions" className="text-primary text-decoration-none" target="_blank" rel="noopener noreferrer"> Google Account settings</a>.
                    </small>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="mb-0">
                <div className="d-flex align-items-center mb-3">
                  <FaEnvelope className="text-info me-3" size={24} />
                  <h2 className="h3 mb-0 text-dark">Contact Us</h2>
                </div>
                <div className="bg-info bg-opacity-10 rounded-3 p-4">
                  <p className="text-muted mb-3">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <FaEnvelope className="text-info me-2" size={16} />
                        <span className="text-muted">Email: arthflow0@gmail.com</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <FaShieldAlt className="text-info me-2" size={16} />
                        <span className="text-muted">Response Time: Within 48 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* Footer Note */}
            <div className="text-center mt-4">
              <small className="text-muted">
                This Privacy Policy may be updated periodically. We will notify you of any significant changes.
              </small>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPrivacy;