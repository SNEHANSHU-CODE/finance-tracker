import React from 'react';
import { Link } from 'react-router-dom';

const FinanceProLanding = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        className="position-relative overflow-hidden" 
        style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh'}}
      >
        {/* Animated Background Elements */}
        <div className="position-absolute w-100 h-100">
          <div className="animated-bg" style={{width: '200px', height: '200px', top: '10%', left: '5%'}}></div>
          <div className="animated-bg" style={{width: '150px', height: '150px', top: '60%', left: '80%', animationDelay: '-5s'}}></div>
          <div className="animated-bg" style={{width: '300px', height: '300px', top: '30%', left: '70%', animationDelay: '-10s'}}></div>
          <div className="animated-bg" style={{width: '100px', height: '100px', top: '80%', left: '10%', animationDelay: '-15s'}}></div>
          <div className="animated-bg" style={{width: '250px', height: '250px', top: '20%', left: '20%', animationDelay: '-7s'}}></div>
          <div className="animated-bg" style={{width: '180px', height: '180px', top: '70%', left: '50%', animationDelay: '-12s'}}></div>
        </div>

        <div className="container position-relative" style={{paddingTop: '8rem', paddingBottom: '8rem'}}>
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6 text-white">
              <div className="transition-all duration-1000 hero-content">
                <h1 className="display-3 fw-bold mb-4" style={{lineHeight: '1.2'}}>
                  Master Your
                  <span className="d-block text-warning">Financial Future</span>
                </h1>
                <p className="lead mb-4 opacity-75">
                  Experience intelligent financial management with real-time analytics, enterprise-grade security, 
                  and powerful insights - completely free with your data always secure.
                </p>
                
                <div className="d-flex flex-column flex-sm-row gap-3 mb-5">
                  <a href="/signup" className="btn btn-warning btn-lg px-4 py-3 fw-semibold d-flex align-items-center justify-content-center" style={{borderRadius: '50px'}}>
                    Get Started Free
                    <i className="fas fa-arrow-right ms-2"></i>
                  </a>
                </div>

                <div className="row text-center">
                  <div className="col-3">
                    <div className="fw-bold fs-4">50K+</div>
                    <div className="small opacity-75">Active Users</div>
                  </div>
                  <div className="col-3">
                    <div className="fw-bold fs-4">$2.5B+</div>
                    <div className="small opacity-75">Tracked Transactions</div>
                  </div>
                  <div className="col-3">
                    <div className="fw-bold fs-4">99.9%</div>
                    <div className="small opacity-75">Uptime</div>
                  </div>
                  <div className="col-3">
                    <div className="fw-bold fs-4">100%</div>
                    <div className="small opacity-75">Free to Use</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="transition-all duration-1000 delay-300" style={{animation: 'float 6s ease-in-out infinite'}}>
                <div className="bg-light rounded-4 shadow-lg p-4" style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))', transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)'}}>
                  <div className="bg-primary rounded-3 p-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="text-white mb-0">Financial Dashboard</h5>
                      <i className="fas fa-chart-line text-white"></i>
                    </div>
                    <div className="row text-white">
                      <div className="col-6">
                        <div className="small opacity-75">Total Balance</div>
                        <div className="fw-bold fs-5">$24,580.50</div>
                      </div>
                      <div className="col-6">
                        <div className="small opacity-75">This Month</div>
                        <div className="fw-bold fs-5 text-success">+12.5%</div>
                      </div>
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-4">
                      <div className="bg-success bg-opacity-10 rounded-2 p-3 text-center">
                        <i className="fas fa-arrow-up text-success"></i>
                        <div className="small mt-1">Income</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-warning bg-opacity-10 rounded-2 p-3 text-center">
                        <i className="fas fa-arrow-down text-warning"></i>
                        <div className="small mt-1">Expenses</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="bg-info bg-opacity-10 rounded-2 p-3 text-center">
                        <i className="fas fa-chart-pie text-info"></i>
                        <div className="small mt-1">Analytics</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5" style={{marginTop: '6rem', marginBottom: '6rem'}}>
        <div className="container">
          <div className="text-center mb-5 transition-all duration-1000 features-header">
            <h2 className="display-5 fw-bold mb-4">Powerful Features for Modern Finance</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Built with cutting-edge technology to deliver exceptional performance, security, and user experience - all completely free
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-lg transition-all duration-500 hover-lift" style={{borderRadius: '1rem'}}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3 text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                    <i className="fas fa-chart-line fa-2x"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Intelligent Insights</h4>
                  <p className="text-muted mb-0">Advanced analytics to help you understand spending patterns and optimize your financial decisions with smart recommendations.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-lg transition-all duration-500 hover-lift" style={{borderRadius: '1rem'}}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3 text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                    <i className="fas fa-tachometer-alt fa-2x"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Real-time Analytics</h4>
                  <p className="text-muted mb-0">Monitor your financial health with live dashboards and instant notifications for better control over your money.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-lg transition-all duration-500 hover-lift" style={{borderRadius: '1rem'}}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3 text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                    <i className="fas fa-shield-alt fa-2x"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Bank-Level Security</h4>
                  <p className="text-muted mb-0">Your data is protected with enterprise-grade encryption and multi-factor authentication. Your privacy is our priority.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-lg transition-all duration-500 hover-lift" style={{borderRadius: '1rem'}}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3 text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                    <i className="fas fa-chart-bar fa-2x"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Advanced Reporting</h4>
                  <p className="text-muted mb-0">Generate comprehensive financial reports with customizable charts and detailed insights to track your progress.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-5 position-relative" style={{background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'}}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-4">Why Choose Finance Tracker?</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Discover the benefits that make FinancePro the perfect choice for managing your finances
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <i className="fas fa-gift fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">100% Free Forever</h4>
                <p className="text-muted">No hidden fees, no premium plans, no limits. Access all features completely free with no strings attached.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                  <i className="fas fa-lock fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">Data Privacy First</h4>
                <p className="text-muted">Your financial data stays secure and private. We never sell or share your information with third parties.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                  <i className="fas fa-mobile-alt fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">Multi-Platform Access</h4>
                <p className="text-muted">Access your financial data anywhere, anytime with our responsive web app and mobile-friendly design.</p>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                  <i className="fas fa-sync-alt fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">Real-time Updates</h4>
                <p className="text-muted">Get instant updates on your financial status with real-time synchronization across all your accounts.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
                  <i className="fas fa-cog fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">Easy Setup</h4>
                <p className="text-muted">Get started in minutes with our intuitive setup process. No complex configurations required.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="text-center p-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle text-white" style={{width: '80px', height: '80px', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>
                  <i className="fas fa-headset fa-2x"></i>
                </div>
                <h4 className="fw-bold mb-3">24/7 Support</h4>
                <p className="text-muted">Our dedicated support team is always here to help you make the most of your financial management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 position-relative" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="container text-center text-white">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-4">Ready to Transform Your Financial Future?</h2>
              <p className="lead mb-5 opacity-75">
                Join thousands of users who trust FinancePro to manage their finances securely and intelligently. 
                Start your journey today - completely free!
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Link to="/signup" className="btn btn-warning btn-lg px-5 py-3 fw-semibold" style={{borderRadius: '50px'}}>
                  Start Free Today
                  <i className="fas fa-arrow-right ms-2"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinanceProLanding;