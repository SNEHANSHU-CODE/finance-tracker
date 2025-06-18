import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaXTwitter,
  FaEnvelope,
} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-black text-light pt-5 pb-3 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row gy-4">
          {/* Brand Section */}
          <div className="col-md-6">
            <h4 className="text-success mb-3">Finance Tracker</h4>
            <p className="text-light small">
              Empower your financial life with powerful insights, expense tracking, and goal setting—all in one place.
            </p>
          </div>

          {/* Support Links */}
          <div className="col-md-3">
            <h6 className="text-uppercase fw-semibold mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><a href="/profile" className="text-light text-decoration-none">Profile</a></li>
              <li><a href="/settings" className="text-light text-decoration-none">Settings</a></li>
              <li><a href="/help" className="text-light text-decoration-none">Help Center</a></li>
              <li><a href="/contact" className="text-light text-decoration-none">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="col-md-3">
            <h6 className="text-uppercase fw-semibold mb-3">Connect with Us</h6>
            <div className="d-flex gap-3 fs-5">
              <a href="#" className="text-light"><FaFacebookF /></a>
              <a href="#" className="text-light"><FaLinkedinIn /></a>
              <a href="#" className="text-light"><FaXTwitter /></a>
              <a href="mailto:support@financetracker.com" className="text-light"><FaEnvelope /></a>
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
