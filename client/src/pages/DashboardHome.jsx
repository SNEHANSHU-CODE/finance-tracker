import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";

export default function DashboardHome() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = usePreferences();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="container-fluid h bg-light nav-top-margin">
      <div className="row">
        {/* Sidebar Toggle Button for Mobile */}
        <button
          className="btn btn-dark d-md-none"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? "Close Menu" : "Menu"}
        </button>

        {/* Sidebar */}
        <nav
          className={`col-md-2 bg-dark sidebar text-white p-3 ${
            isSidebarOpen ? "d-block" : "d-none"
          } d-md-block`}
        >
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard">{t('dashboard')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/transactions">{t('transactions')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/analytics">{t('analytics_dashboard')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/goals">{t('goals')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/reminders">{t('reminders')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/settings">{t('settings')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/dashboard/profile">{t('profile')}</Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="col-md-10 ms-sm-auto px-md-4 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
