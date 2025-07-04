import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategoryAnalysis, fetchDashboard, fetchGoalsProgress, fetchSpendingTrends, fetchCurrentMonthAnalytics, fetchIncomeTrends, fetchSavingsTrends,
} from '../app/analyticsSlice';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaEye,
  // FaTarget,
  FaCreditCard,
  FaShoppingCart,
  FaPiggyBank,
  FaHome,
  FaCar,
  FaUtensils,
  FaGamepad,
  FaHeartbeat,
  FaGraduationCap,
  FaPlane,
  FaBolt,
  FaSync
} from 'react-icons/fa';


const AnalyticsDashboard = () => {
  const dispatch = useDispatch();

  const dashboardData = useSelector((state) => state.analytics.dashboard) || {};
  const goalsData = useSelector((state) => state.analytics.goalsProgress) || { goals: [], summary: {} };
  const spendingTrends = useSelector((state) => state.analytics.spendingTrends) || { trends: [] };
  const categoryData = useSelector((state) => state.analytics.categoryAnalysis) || { categories: [] };


  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchGoalsProgress());
    dispatch(fetchSpendingTrends());
    dispatch(fetchCategoryAnalysis());
    dispatch(fetchCurrentMonthAnalytics());
    dispatch(fetchIncomeTrends());
    dispatch(fetchSavingsTrends());
  }, [dispatch]);


  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getChangeColor = (value) => {
    return value >= 0 ? 'text-success' : 'text-danger';
  };

  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([
      dispatch(fetchDashboard()),
      dispatch(fetchGoalsProgress()),
      dispatch(fetchSpendingTrends()),
      dispatch(fetchCategoryAnalysis())
    ]).finally(() => {
      setIsLoading(false);
    });
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col">
              <div className={`text-${color} text-uppercase mb-1 small fw-bold`}>
                {title}
              </div>
              <div className="h5 mb-0 fw-bold text-gray-800">
                {typeof value === 'number' ? formatCurrency(value) : value}
              </div>
              {change !== undefined && (
                <div className={`small ${getChangeColor(change)}`}>
                  {change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {' '}{Math.abs(change)}%
                </div>
              )}
            </div>
            <div className="col-auto">
              <div className={`bg-${color} text-white rounded-circle p-3`}>
                {icon}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="mb-2 fw-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <div className="row">
      {/* Stats Cards */}
      <div className="col-12 mb-4">
        <div className="row">
          <StatCard
            title="Total Income"
            value={dashboardData?.monthly?.summary?.totalIncome || 0}
            change={8.5}
            icon={<FaWallet />}
            color="success"
          />
          <StatCard
            title="Total Expenses"
            value={dashboardData?.monthly?.summary?.totalExpenses || 0}
            change={-2.3}
            icon={<FaCreditCard />}
            color="danger"
          />
          <StatCard
            title="Net Savings"
            value={dashboardData?.monthly?.summary?.netSavings || 0}
            change={15.2}
            icon={<FaPiggyBank />}
            color="info"
          />
          <StatCard
            title="Savings Rate"
            value={`${dashboardData?.monthly?.summary?.savingsRate || 0}%`}
            change={3.1}
            // icon={<FaTarget />}
            color="warning"
          />
        </div>
      </div>

      {/* Spending Trends Chart */}
      <div className="col-xl-8 col-lg-7 mb-4">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Financial Trends</h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingTrends.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthYear" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalIncome"
                  stroke="#28a745"
                  strokeWidth={3}
                  dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="totalExpenses"
                  stroke="#dc3545"
                  strokeWidth={3}
                  dot={{ fill: '#dc3545', strokeWidth: 2, r: 4 }}
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="netSavings"
                  stroke="#17a2b8"
                  strokeWidth={3}
                  dot={{ fill: '#17a2b8', strokeWidth: 2, r: 4 }}
                  name="Net Savings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="col-xl-4 col-lg-5 mb-4">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Spending by Category</h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.categories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                >
                  {categoryData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label, payload) => {
                    // Find the category name from the payload
                    const categoryName = payload && payload[0] ? payload[0].payload.category : '';
                    return categoryName;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="col-xl-8 col-lg-7 mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Recent Transactions</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Description</th>
                    <th className="border-0">Category</th>
                    <th className="border-0">Date</th>
                    <th className="border-0 text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData?.recent || []).map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-bold">{transaction.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className={`text-end fw-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      <div className="col-xl-4 col-lg-5 mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Goals Progress</h6>
          </div>
          <div className="card-body">
            {goalsData.goals.map((goal, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">{goal.name}</span>
                  <span className="text-muted">{goal.progress}%</span>
                </div>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${goal.progress}%` }}
                    aria-valuenow={goal.progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="d-flex justify-content-between text-muted small">
                  <span>{formatCurrency(goal.savedAmount)}</span>
                  <span>{formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Replace the renderSpending function with this updated version:

  const renderSpending = () => {
    // Ensure all categories have data, set to 0 if missing
    const allCategories = [
      'Food', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 
      'Healthcare', 'Education', 'Travel', 'Insurance', 'Rent', 'Other Expense'
    ];

    // Create a complete dataset with all categories
    const completeCategories = allCategories.map(categoryName => {
      const existingCategory = categoryData.categories.find(cat => cat.category === categoryName);
      return {
        category: categoryName,
        amount: existingCategory?.amount || 0,
        percentage: existingCategory?.percentage || 0
      };
    });

    return (
      <div className="row">
        {/* Category Spending Bar Chart */}
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">Spending by Category</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={completeCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="category"
                    stroke="#8884d8"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#8884d8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {completeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Spending Trends Area Chart */}
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">Monthly Spending Trends</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={spendingTrends.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthYear" stroke="#8884d8" />
                  <YAxis stroke="#8884d8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalExpenses"
                    stroke="#dc3545"
                    fill="#dc3545"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncome = () => (
    <div className="row">
      {/* Income Trends */}
      <div className="col-12 mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Income Trends</h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={spendingTrends.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthYear" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalIncome"
                  stroke="#28a745"
                  fill="#28a745"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="row">
      {/* Goals Overview */}
      <div className="col-12 mb-4">
        <div className="row">
          <div className="col-md-3">
            <div className="card bg-primary text-white mb-3">
              <div className="card-body text-center">
                <h3 className="card-title">{goalsData.summary.totalGoals}</h3>
                <p className="card-text">Total Goals</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white mb-3">
              <div className="card-body text-center">
                <h3 className="card-title">{goalsData.summary.onTrackGoals}</h3>
                <p className="card-text">On Track</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white mb-3">
              <div className="card-body text-center">
                <h3 className="card-title">{goalsData.summary.overdueGoals}</h3>
                <p className="card-text">Overdue</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white mb-3">
              <div className="card-body text-center">
                <h3 className="card-title">{goalsData.summary.averageProgress.toFixed(1)}%</h3>
                <p className="card-text">Avg Progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Goals */}
      <div className="col-12">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">Goal Details</h6>
          </div>
          <div className="card-body">
            <div className="row">
              {goalsData.goals.map((goal, index) => (
                <div key={index} className="col-md-6 mb-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title d-flex align-items-center">
                        {/* <FaTarget className="me-2 text-primary" /> */}
                        {goal.name}
                      </h6>
                      <div className="progress mb-3" style={{ height: '12px' }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${goal.progress}%` }}
                          aria-valuenow={goal.progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Progress:</span>
                        <span className="fw-bold">{goal.progress}%</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Saved:</span>
                        <span className="fw-bold text-success">{formatCurrency(goal.savedAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Target:</span>
                        <span className="fw-bold">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'spending':
        return renderSpending();
      case 'income':
        return renderIncome();
      case 'goals':
        return renderGoals();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="container-fluid px-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Analytics Dashboard</h1>
              <p className="text-muted">Track your financial progress and insights</p>
            </div>
            <div className="d-flex gap-2">
              <div className="dropdown">
                <button
                  className="btn btn-outline-primary dropdown-toggle"
                  type="button"
                  id="periodDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <FaCalendarAlt className="me-2" />
                  {selectedPeriod === '30days' ? 'Last 30 Days' :
                    selectedPeriod === '90days' ? 'Last 90 Days' :
                      selectedPeriod === '1year' ? 'Last Year' : 'Last 30 Days'}
                </button>
                <ul className="dropdown-menu" aria-labelledby="periodDropdown">
                  <li><a className="dropdown-item" href="#" onClick={() => setSelectedPeriod('30days')}>Last 30 Days</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => setSelectedPeriod('90days')}>Last 90 Days</a></li>
                  <li><a className="dropdown-item" href="#" onClick={() => setSelectedPeriod('1year')}>Last Year</a></li>
                </ul>
              </div>
              <button className="btn btn-outline-secondary">
                <FaDownload className="me-2" />
                Export
              </button>
              <button className="btn btn-primary" onClick={handleRefresh}>
                <FaSync className={`me-2 ${isLoading ? 'fa-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FaChartLine className="me-2" />
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'spending' ? 'active' : ''}`}
                onClick={() => setActiveTab('spending')}
              >
                <FaCreditCard className="me-2" />
                Spending
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
              >
                <FaWallet className="me-2" />
                Income
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                {/* <FaTarget className="me-2" /> */}
                Goals
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="row">
        <div className="col-12">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;