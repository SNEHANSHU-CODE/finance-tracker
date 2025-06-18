import React, { useState } from "react";
import { 
  FaChartLine,
  FaChartPie,
  FaChartBar,
  // FaTrendingUp,
  // FaTrendingDown,
  FaDownload,
  FaPrint,
  FaFilter,
  FaCalendarAlt,
  FaFileAlt,
  FaEye,
  FaDollarSign,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaShoppingCart,
  FaCar,
  FaHome,
  FaUtensils,
  FaGamepad,
  FaPiggyBank,
  FaCreditCard,
  FaExchangeAlt,
  FaSearch,
  FaShareAlt,
  // FaUserChart,
  FaClipboardList
} from "react-icons/fa";

export default function AnalyticsReports() {
  const [reportPeriod, setReportPeriod] = useState("thisMonth");
  const [reportType, setReportType] = useState("overview");
  const [chartView, setChartView] = useState("monthly");

  // Sample analytics data
  const analyticsData = {
    monthlyTrends: [
      { month: "Jan", income: 4200, expenses: 2850, savings: 1350 },
      { month: "Feb", income: 4200, expenses: 3100, savings: 1100 },
      { month: "Mar", income: 4500, expenses: 2950, savings: 1550 },
      { month: "Apr", income: 4200, expenses: 3200, savings: 1000 },
      { month: "May", income: 4400, expenses: 2800, savings: 1600 },
      { month: "Jun", income: 4200, expenses: 2850, savings: 1350 }
    ],
    categoryBreakdown: [
      { category: "Food & Dining", amount: 485.30, percentage: 35, trend: -5.2, color: "warning" },
      { category: "Transportation", amount: 320.15, percentage: 25, trend: 2.1, color: "info" },
      { category: "Shopping", amount: 245.80, percentage: 18, trend: 8.5, color: "danger" },
      { category: "Entertainment", amount: 180.50, percentage: 15, trend: -2.8, color: "secondary" },
      { category: "Utilities", amount: 95.00, percentage: 7, trend: 0.5, color: "dark" }
    ]
  };

  const keyMetrics = {
    totalSpent: 1326.75,
    avgDaily: 44.23,
    largestExpense: 485.30,
    transactionCount: 24,
    budgetUtilization: 76.8,
    savingsGoal: 88.5
  };

  const recentReports = [
    {
      id: 1,
      title: "Monthly Expense Report",
      type: "Expense Analysis",
      date: "2025-06-15",
      status: "Generated",
      icon: FaChartPie,
      color: "primary"
    },
    {
      id: 2,
      title: "Quarterly Budget Review",
      type: "Budget Report",
      date: "2025-06-10",
      status: "In Progress",
      icon: FaChartBar,
      color: "warning"
    },
    {
      id: 3,
      title: "Savings Goal Analysis",
      type: "Goal Tracking",
      date: "2025-06-08",
      status: "Completed",
      icon: FaPiggyBank,
      color: "success"
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTrendIcon = (trend) => {
    return trend > 0 
      
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h4 className="mb-1">Analytics & Reports</h4>
              <p className="text-muted mb-0">Detailed insights into your financial patterns</p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <select 
                className="form-select form-select-sm"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="thisYear">This Year</option>
              </select>
              <select 
                className="form-select form-select-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="overview">Overview</option>
                <option value="expense">Expense Analysis</option>
                <option value="income">Income Tracking</option>
                <option value="budget">Budget Performance</option>
                <option value="goals">Goal Progress</option>
              </select>
              <div className="btn-group" role="group">
                <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                  <FaDownload size={12} />
                  Export
                </button>
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                  <FaPrint size={12} />
                  Print
                </button>
                <button className="btn btn-outline-info btn-sm d-flex align-items-center gap-2">
                  <FaShareAlt size={12} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaDollarSign className="text-primary" size={20} />
              </div>
              <h6 className="fw-bold text-primary mb-1">{formatCurrency(keyMetrics.totalSpent)}</h6>
              <small className="text-muted">Total Spent</small>
            </div>
          </div>
        </div>

        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaChartLine className="text-success" size={20} />
              </div>
              <h6 className="fw-bold text-success mb-1">{formatCurrency(keyMetrics.avgDaily)}</h6>
              <small className="text-muted">Avg Daily</small>
            </div>
          </div>
        </div>

        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaArrowUp className="text-warning" size={20} />
              </div>
              <h6 className="fw-bold text-warning mb-1">{formatCurrency(keyMetrics.largestExpense)}</h6>
              <small className="text-muted">Largest Expense</small>
            </div>
          </div>
        </div>

        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaClipboardList className="text-info" size={20} />
              </div>
              <h6 className="fw-bold text-info mb-1">{keyMetrics.transactionCount}</h6>
              <small className="text-muted">Transactions</small>
            </div>
          </div>
        </div>

        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaPercentage className="text-danger" size={20} />
              </div>
              <h6 className="fw-bold text-danger mb-1">{keyMetrics.budgetUtilization}%</h6>
              <small className="text-muted">Budget Used</small>
            </div>
          </div>
        </div>

        <div className="col-lg-2 col-md-4 col-sm-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-3">
              <div className="mb-2">
                <FaPiggyBank className="text-success" size={20} />
              </div>
              <h6 className="fw-bold text-success mb-1">{keyMetrics.savingsGoal}%</h6>
              <small className="text-muted">Goal Progress</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Charts and Graphs Section */}
        <div className="col-lg-8">
          {/* Monthly Trends Chart */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-0 pt-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Financial Trends</h5>
                <div className="btn-group btn-group-sm" role="group">
                  <input type="radio" className="btn-check" name="chartView" id="monthly" checked={chartView === "monthly"} onChange={() => setChartView("monthly")} />
                  <label className="btn btn-outline-primary" htmlFor="monthly">Monthly</label>
                  
                  <input type="radio" className="btn-check" name="chartView" id="weekly" checked={chartView === "weekly"} onChange={() => setChartView("weekly")} />
                  <label className="btn btn-outline-primary" htmlFor="weekly">Weekly</label>
                  
                  <input type="radio" className="btn-check" name="chartView" id="yearly" checked={chartView === "yearly"} onChange={() => setChartView("yearly")} />
                  <label className="btn btn-outline-primary" htmlFor="yearly">Yearly</label>
                </div>
              </div>
            </div>
            <div className="card-body pt-2">
              {/* Placeholder for Chart - In real app, use Chart.js or similar */}
              <div className="bg-light rounded p-4 text-center" style={{ height: '300px' }}>
                <FaChartLine size={48} className="text-muted mb-3" />
                <h6 className="text-muted">Income vs Expenses Trend Chart</h6>
                <p className="text-muted small mb-3">Interactive chart showing financial trends over time</p>
                <div className="row text-center">
                  {analyticsData.monthlyTrends.slice(-3).map((month, index) => (
                    <div key={index} className="col-4">
                      <div className="border rounded p-2 bg-white">
                        <small className="fw-bold text-primary">{month.month}</small>
                        <div className="mt-1">
                          <small className="text-success d-block">+{formatCurrency(month.income)}</small>
                          <small className="text-danger d-block">-{formatCurrency(month.expenses)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category Analysis */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Category Analysis</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FaFilter size={12} className="me-1" />
                  Filter
                </button>
              </div>
            </div>
            <div className="card-body pt-2">
              {analyticsData.categoryBreakdown.map((category, index) => (
                <div key={index} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-medium">{category.category}</span>
                      {getTrendIcon(category.trend)}
                      <small className={`${category.trend > 0 ? 'text-danger' : 'text-success'}`}>
                        {Math.abs(category.trend)}%
                      </small>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold">{formatCurrency(category.amount)}</span>
                      <small className="text-muted d-block">{category.percentage}% of total</small>
                    </div>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className={`progress-bar bg-${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Quick Insights */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">Quick Insights</h5>
            </div>
            <div className="card-body pt-2">
              <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded mb-3">
                {/* <FaTrendingUp className="text-success me-3" size={20} /> */}
                <div>
                  <small className="fw-bold text-success">Savings Increased</small>
                  <div className="text-muted small">15% higher than last month</div>
                </div>
              </div>
              
              <div className="d-flex align-items-center p-3 bg-warning bg-opacity-10 rounded mb-3">
                <FaShoppingCart className="text-warning me-3" size={20} />
                <div>
                  <small className="fw-bold text-warning">Shopping Alert</small>
                  <div className="text-muted small">8% increase in shopping expenses</div>
                </div>
              </div>
              
              <div className="d-flex align-items-center p-3 bg-info bg-opacity-10 rounded">
                {/* <FaUserChart className="text-info me-3" size={20} /> */}
                <div>
                  <small className="fw-bold text-info">Budget Status</small>
                  <div className="text-muted small">On track to meet monthly goals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-0 pt-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Reports</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FaEye size={12} className="me-1" />
                  View All
                </button>
              </div>
            </div>
            <div className="card-body pt-2">
              {recentReports.map((report) => (
                <div key={report.id} className="d-flex align-items-center p-2 rounded hover-bg-light mb-2" style={{ cursor: 'pointer' }}>
                  <div className={`p-2 bg-${report.color} bg-opacity-10 rounded me-3`}>
                    <report.icon className={`text-${report.color}`} size={16} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-medium small">{report.title}</div>
                    <div className="text-muted small">{report.type}</div>
                    <div className="text-muted small">
                      <FaCalendarAlt size={10} className="me-1" />
                      {formatDate(report.date)}
                    </div>
                  </div>
                  <span className={`badge bg-${report.color} bg-opacity-20 text-${report.color} small`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Actions */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0">Generate Reports</h5>
            </div>
            <div className="card-body pt-2">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2">
                  <FaChartPie size={14} />
                  Expense Report
                </button>
                <button className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2">
                  <FaChartBar size={14} />
                  Income Analysis
                </button>
                <button className="btn btn-outline-info d-flex align-items-center justify-content-center gap-2">
                  <FaPiggyBank size={14} />
                  Savings Report
                </button>
                <button className="btn btn-outline-warning d-flex align-items-center justify-content-center gap-2">
                  <FaFileAlt size={14} />
                  Custom Report
                </button>
              </div>
              
              <hr className="my-3" />
              
              <div className="input-group input-group-sm">
                <input type="text" className="form-control" placeholder="Search reports..." />
                <button className="btn btn-outline-secondary" type="button">
                  <FaSearch size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Performance Summary */}
      <div className="row g-3 mt-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Monthly Performance</h6>
                  <h4 className="fw-bold text-primary mb-0">Good</h4>
                  <small className="text-muted">Above average spending control</small>
                </div>
                <div className="p-3 bg-primary bg-opacity-10 rounded-circle">
                  <FaChartLine className="text-primary" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Budget Efficiency</h6>
                  <h4 className="fw-bold text-success mb-0">Excellent</h4>
                  <small className="text-muted">23% under budget this month</small>
                </div>
                <div className="p-3 bg-success bg-opacity-10 rounded-circle">
                  <FaPercentage className="text-success" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Savings Trend</h6>
                  <h4 className="fw-bold text-info mb-0">Growing</h4>
                  <small className="text-muted">Consistent upward trajectory</small>
                </div>
                <div className="p-3 bg-info bg-opacity-10 rounded-circle">
                  {/* <FaTrendingUp className="text-info" size={24} /> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}