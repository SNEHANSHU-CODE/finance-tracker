import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategoryAnalysis, fetchDashboard, fetchGoalsProgress, fetchSpendingTrends, fetchCurrentMonthAnalytics, fetchIncomeTrends, fetchSavingsTrends,
} from '../app/analyticsSlice';
import { Link } from "react-router-dom";

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
  const previousMonthData = useSelector((state) => state.analytics.previousMonth) || {};

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

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    if (!current) return -100;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return Math.round(change * 100) / 100;
  };

  const getChangeValues = () => {
    try {
      const trends = spendingTrends?.trends || [];
      
      if (trends.length < 2) {
        // If we don't have enough data, return 0 changes
        return {
          incomeChange: 0,
          expenseChange: 0,
          savingsChange: 0,
          savingsRateChange: 0
        };
      }
      
      // Get last two months from trends
      const currentMonth = trends[trends.length - 1];
      const previousMonth = trends[trends.length - 2];
      
      return {
        incomeChange: calculatePercentageChange(
          currentMonth.totalIncome || 0, 
          previousMonth.totalIncome || 0
        ),
        expenseChange: calculatePercentageChange(
          currentMonth.totalExpenses || 0, 
          previousMonth.totalExpenses || 0
        ),
        savingsChange: calculatePercentageChange(
          currentMonth.netSavings || 0, 
          previousMonth.netSavings || 0
        ),
        savingsRateChange: calculatePercentageChange(
          (currentMonth.netSavings / currentMonth.totalIncome) * 100 || 0, 
          (previousMonth.netSavings / previousMonth.totalIncome) * 100 || 0
        )
      };
    } catch (error) {
      console.error('Error calculating change values:', error);
      return {
        incomeChange: 0,
        expenseChange: 0,
        savingsChange: 0,
        savingsRateChange: 0
      };
    }
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

  const renderOverview = () => {
    const changeValues = getChangeValues();
    return(
    <div className="row">
      {/* Stats Cards */}
      <div className="col-12 mb-4">
          <div className="row">
            <StatCard
              title="Total Income"
              value={dashboardData?.monthly?.summary?.totalIncome || 0}
              change={changeValues.incomeChange}
              icon={<FaWallet />}
              color="success"
            />
            <StatCard
              title="Total Expenses"
              value={dashboardData?.monthly?.summary?.totalExpenses || 0}
              change={changeValues.expenseChange}
              icon={<FaCreditCard />}
              color="danger"
            />
            <StatCard
              title="Net Savings"
              value={dashboardData?.monthly?.summary?.netSavings || 0}
              change={changeValues.savingsChange}
              icon={<FaPiggyBank />}
              color="info"
            />
            <StatCard
              title="Savings Rate"
              value={`${dashboardData?.monthly?.summary?.savingsRate || 0}%`}
              change={changeValues.savingsRateChange}
              icon={<FaChartLine />}
              color="warning"
            />
          </div>
        </div>

      {/* Spending Trends Chart */}
      {/* Spending Trends Chart */}
<div className="col-xl-8 col-lg-7 mb-4">
  <div className="card shadow-sm border-0 h-100">
    <div className="card-header bg-white border-0 py-3">
      <h6 className="m-0 fw-bold text-primary">Financial Trends</h6>
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart 
          data={spendingTrends.trends}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthYear" 
            stroke="#8884d8"
            tick={{ fontSize: 12 }}
            interval={'preserveStartEnd'}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#8884d8"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<CustomTooltip />}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="totalIncome"
            stroke="#28a745"
            strokeWidth={2}
            dot={{ fill: '#28a745', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="totalExpenses"
            stroke="#dc3545"
            strokeWidth={2}
            dot={{ fill: '#dc3545', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="netSavings"
            stroke="#17a2b8"
            strokeWidth={2}
            dot={{ fill: '#17a2b8', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            name="Net Savings"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>

      {/* Category Breakdown */}
{/* Category Breakdown */}
<div className="col-xl-4 col-lg-5 mb-4">
  <div className="card shadow-sm border-0 h-100">
    <div className="card-header bg-white border-0 py-3">
      <h6 className="m-0 fw-bold text-primary">Spending by Category</h6>
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={categoryData.categories}
            cx="50%"
            cy="50%"
            outerRadius={window.innerWidth < 768 ? 60 : 80}
            fill="#8884d8"
            dataKey="amount"
            label={({ category, percentage }) => 
              window.innerWidth < 768 ? 
                `${percentage.toFixed(0)}%` : 
                `${category} ${percentage.toFixed(0)}%`
            }
            labelLine={true}
            fontSize={window.innerWidth < 768 ? 10 : 12}
          >
            {categoryData.categories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => [formatCurrency(value), props.payload.category]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              padding: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Mobile Legend */}
      <div className="d-block d-md-none mt-3">
        <div className="row">
          {categoryData.categories.map((entry, index) => (
            <div key={index} className="col-6 mb-2">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle me-2" 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: COLORS[index % COLORS.length] 
                  }}
                ></div>
                <small className="text-truncate">{entry.category}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
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
  };

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
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      <div>
        <h1 className="h3 mb-0 text-gray-800">Analytics Dashboard</h1>
        <p className="text-muted mb-0">Track your financial progress and insights</p>
      </div>
      <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto" style={{ maxWidth: '400px' }}>
        <div className="dropdown">
          <button
            className="btn btn-outline-primary dropdown-toggle w-100 w-sm-auto"
            type="button"
            id="periodDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <FaCalendarAlt className="me-2" />
            <span className="d-none d-sm-inline">
              {selectedPeriod === '30days' ? 'Last 30 Days' :
                selectedPeriod === '90days' ? 'Last 90 Days' :
                  selectedPeriod === '1year' ? 'Last Year' : 'Last 30 Days'}
            </span>
            <span className="d-inline d-sm-none">
              {selectedPeriod === '30days' ? '30D' :
                selectedPeriod === '90days' ? '90D' :
                  selectedPeriod === '1year' ? '1Y' : '30D'}
            </span>
          </button>
          <ul className="dropdown-menu" aria-labelledby="periodDropdown">
            <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('30days')}>Last 30 Days</Link></li>
            <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('90days')}>Last 90 Days</Link></li>
            <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('1year')}>Last Year</Link></li>
          </ul>
        </div>
        <button className="btn btn-outline-secondary w-100 w-sm-auto">
          <FaDownload className="me-2" />
          <span className="d-none d-sm-inline">Export</span>
        </button>
        <button className="btn btn-primary w-100 w-sm-auto" onClick={handleRefresh}>
          <FaSync className={`me-2 ${isLoading ? 'fa-spin' : ''}`} />
          <span className="d-none d-sm-inline">Refresh</span>
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