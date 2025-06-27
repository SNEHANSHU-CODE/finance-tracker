import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaEnvelope,
} from "react-icons/fa6";

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-light pt-5 pb-3 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row gy-4">
          {/* Brand Section */}
          <div className="col-md-3">
            <div className="d-flex align-items-center mb-3">
              <img 
                src="/favicon.png" 
                alt="Finance Tracker Logo"
                className="navbar-brand-img me-2"
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  objectPosition: 'center'
                }}
          />
              <h4 className="text-success mb-0">Finance Tracker</h4>
            </div>
            <div className="d-flex align-items-center">
              <p className="text-light small">
              Empower your financial life with powerful insights, expense tracking, and goal setting—all in one place.
            </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-md-3">
            <h6 className="text-uppercase fw-semibold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li><Link to="/profile" className="text-light text-decoration-none">Profile</Link></li>
              <li><Link to="/settings" className="text-light text-decoration-none">Settings</Link></li>
              <li><Link to="/help" className="text-light text-decoration-none">Help Center</Link></li>
              <li><Link to="/contact" className="text-light text-decoration-none">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-md-3">
            <h6 className="text-uppercase fw-semibold mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><Link to="/profile" className="text-light text-decoration-none">Profile</Link></li>
              <li><Link to="/service" className="text-light text-decoration-none">Term of Service</Link></li>
              <li><Link to="/privacy" className="text-light text-decoration-none">Privacy Policy</Link></li>
              <li><Link to="/authorsnote" className="text-light text-decoration-none">Author's Note</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="col-md-3">
            <h6 className="text-uppercase fw-semibold mb-3">Connect with Us</h6>
            <div className="d-flex gap-3 fs-5">
              <Link to="#" className="text-light"><FaFacebookF /></Link>
              <Link to="#" className="text-light"><FaLinkedinIn /></Link>
              <Link to="#" className="text-light"><FaXTwitter /></Link>
              <Link to="mailto:financetracker.v1@gmail.com" className="text-light"><FaEnvelope /></Link>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary" />

        <div className="text-center small text-light">
          &copy; {new Date().getFullYear()} Finance Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
