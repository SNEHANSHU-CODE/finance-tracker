import React from 'react';
import { Link } from 'react-router-dom';
import img from '../assets/Images/landingpage-img.avif';

export default function LandingPage() {
    return (
        <div>
            {/* Hero Section */}
            <section className="bg-light text-dark py-5">
                <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between">
                    <div className="mb-4 mb-md-0">
                        <h1 className="display-4 fw-bold">Track Your Finances Smarter</h1>
                        <p className="lead">Stay on top of your income, expenses, and budgets in real-time with our intuitive dashboard.</p>
                        <div className="mt-4">
                            <Link to="/signup" className="btn btn-success btn-lg me-3">Get Started</Link>
                            <Link to="/login" className="btn btn-outline-secondary btn-lg">Login</Link>
                        </div>
                    </div>
                    <img
                        src={img}
                        alt="Finance Illustration"
                        className="img-fluid rounded shadow-sm"
                        style={{ maxWidth: '450px' }}
                    />
                </div>
            </section>

            {/* Features Section */}
            <section className="container py-5">
                <div className="row text-center">
                    <div className="col-md-4 mb-4">
                        <div className="border p-4 rounded shadow-sm h-100">
                            <h5 className="fw-bold">Smart Budgeting</h5>
                            <p>Set monthly goals and track where your money goes with detailed insights.</p>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="border p-4 rounded shadow-sm h-100">
                            <h5 className="fw-bold">Real-time Dashboard</h5>
                            <p>Get a clear view of your financial health with live income and expense tracking.</p>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="border p-4 rounded shadow-sm h-100">
                            <h5 className="fw-bold">Secure & Private</h5>
                            <p>Your data is encrypted and safe. We value your privacy above all.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="bg-success text-white py-5 text-center">
                <div className="container">
                    <h2 className="fw-bold mb-3">Ready to take control of your finances?</h2>
                    <Link to="/signup" className="btn btn-light btn-lg">Create Free Account</Link>
                </div>
            </section>
        </div>
    );
}

