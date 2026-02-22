import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAllAnalyticsData } from '../hooks/useAnalyticsGraphQL';
import { useSettings } from '../context/SettingsContext';
import {
  validateDashboard,
  validateSpendingTrends,
  validateCategoryAnalysis,
  validateGoalsProgress,
  getChangeValues,
  ensureAllCategories,
  isAnalyticsEmpty,
  toNumber,
} from '../utils/analyticsTransformers';

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
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaDownload,
  FaCreditCard,
  FaPiggyBank,
  FaSync
} from 'react-icons/fa';

const AnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const accessToken = useSelector((state) => state.auth?.accessToken);
  const { t, formatCurrency: formatCurrencyFromSettings, formatDate: formatDateFromSettings, isDark } = useSettings();

  useEffect(() => {
    const getDateRange = (period) => {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    };

    setDateRange(getDateRange(selectedPeriod));
  }, [selectedPeriod]);

  const { analytics: analyticsData, loading: isLoading, error, refetch } = useAllAnalyticsData(
    dateRange.startDate,
    dateRange.endDate,
    {
      skip: !dateRange.startDate || !dateRange.endDate,
      onError: (error) => {
        console.error('Analytics fetch error:', error);
      }
    }
  );

  const validatedData = useMemo(() => {
    if (!analyticsData) {
      return {
        dashboard: validateDashboard(null),
        spendingTrends: validateSpendingTrends(null),
        categoryAnalysis: validateCategoryAnalysis(null),
        goalsProgress: validateGoalsProgress(null),
        isEmpty: true,
      };
    }
    return {
      dashboard: validateDashboard(analyticsData.dashboard),
      spendingTrends: validateSpendingTrends(analyticsData.spendingTrends),
      categoryAnalysis: validateCategoryAnalysis(analyticsData.categoryAnalysis),
      goalsProgress: validateGoalsProgress(analyticsData.goalsProgress),
      isEmpty: isAnalyticsEmpty(analyticsData),
    };
  }, [analyticsData]);

  const dashboardData = validatedData.dashboard;
  const spendingTrends = validatedData.spendingTrends;
  const categoryData = validatedData.categoryAnalysis;
  const goalsData = validatedData.goalsProgress;
  const hasNoData = validatedData.isEmpty;

  const safeTrends = useMemo(() => {
    console.log(spendingTrends);
    return (spendingTrends?.trends || []).map(item => ({
      monthYear: item.monthYear,
      totalIncome: toNumber(item.totalIncome),
      totalExpenses: Math.abs(toNumber(item.totalExpenses)), // Convert to positive
      netSavings: toNumber(item.netSavings),
    }));
  }, [spendingTrends]);

  const safeCategories = useMemo(() => {
    console.log(categoryData)
    return (categoryData.categories || []).map(c => ({
      category: c.category,
      amount: toNumber(c.amount),
      percentage: toNumber(c.percentage),
    }));
  }, [categoryData]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
  
  const chartColors = useMemo(() => ({
    grid: isDark ? '#374151' : '#f0f0f0',
    axis: isDark ? '#9CA3AF' : '#8884d8',
    tooltip: isDark ? '#1F2937' : 'white',
    tooltipBorder: isDark ? '#374151' : '#ccc',
    text: isDark ? '#E5E7EB' : '#333',
  }), [isDark]);

  const formatCurrency = (amount) => formatCurrencyFromSettings(Math.abs(toNumber(amount)));

  const getChangeColor = (value) => {
    return toNumber(value) >= 0 ? 'text-success' : 'text-danger';
  };

  const getChangeValuesFromTrends = () => {
    return getChangeValues(spendingTrends?.trends || []);
  };

  const handleRefresh = () => {
    if (refetch) {
      refetch();
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!accessToken) {
        alert(t('login'));
        return;
      }

      const apiUrl = (import.meta.env.VITE_ANALYTICS_URL + '/api') || 'http://localhost:5001/api';
      const url = `${apiUrl}/pdf/generate-report`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url_obj = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_obj;
      link.download = `financial-report-${dateRange.startDate}-${dateRange.endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_obj);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download report: ${error.message}`);
    }
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
                  {' '}{Math.abs(change).toFixed(1)}%
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
        <div className="p-3 border rounded shadow-sm" style={{
          backgroundColor: chartColors.tooltip,
          borderColor: chartColors.tooltipBorder,
          color: chartColors.text,
        }}>
          <p className="mb-2 fw-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const EmptyState = ({ message }) => (
    <div className="text-center py-5">
      <FaChartLine className="text-muted mb-3" size={48} />
      <h5 className="text-muted">{message || t('no_data_available')}</h5>
      <p className="text-muted">{t('add_transactions_to_see_analytics')}</p>
    </div>
  );

  const renderOverview = () => {
    if (hasNoData && !isLoading) {
      return <EmptyState message={t('no_analytics_data')} />;
    }

    if (!safeTrends.length && !isLoading) {
      return <EmptyState message={t('no_trend_data')} />;
    }

    const changeValues = getChangeValuesFromTrends();
    
    return (
      <div className="row">
        <div className="col-12 mb-4">
          <div className="row">
            <StatCard
              title={t('monthly_income')}
              value={dashboardData?.monthly?.summary?.totalIncome || 0}
              change={changeValues.incomeChange}
              icon={<FaWallet />}
              color="success"
            />
            <StatCard
              title={t('monthly_expenses')}
              value={dashboardData?.monthly?.summary?.totalExpenses || 0}
              change={changeValues.expenseChange}
              icon={<FaCreditCard />}
              color="danger"
            />
            <StatCard
              title={t('net_savings_series')}
              value={dashboardData?.monthly?.summary?.netSavings || 0}
              change={changeValues.savingsChange}
              icon={<FaPiggyBank />}
              color="info"
            />
            <StatCard
              title={t('savings_rate')}
              value={`${(dashboardData?.monthly?.summary?.savingsRate || 0).toFixed(1)}%`}
              change={changeValues.savingsRateChange}
              icon={<FaChartLine />}
              color="warning"
            />
          </div>
        </div>

        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('financial_trends')}</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={safeTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="monthYear"
                    stroke={chartColors.axis}
                    tick={{ fontSize: 12, fill: chartColors.text }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke={chartColors.axis}
                    tick={{ fontSize: 12, fill: chartColors.text }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
                  <Line
                    type="monotone"
                    dataKey="totalIncome"
                    stroke="#28a745"
                    strokeWidth={2}
                    dot={{ fill: '#28a745', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={t('income_series')}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalExpenses"
                    stroke="#dc3545"
                    strokeWidth={2}
                    dot={{ fill: '#dc3545', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={t('expenses_series')}
                  />
                  <Line
                    type="monotone"
                    dataKey="netSavings"
                    stroke="#17a2b8"
                    strokeWidth={2}
                    dot={{ fill: '#17a2b8', r: 3 }}
                    activeDot={{ r: 5 }}
                    name={t('net_savings_series')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('spending_by_category')}</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={safeCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                    labelLine={true}
                  >
                    {safeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [formatCurrency(value), props.payload.category]}
                    contentStyle={{
                      backgroundColor: chartColors.tooltip,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      color: chartColors.text
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('recent_transactions_title')}</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">{t('description')}</th>
                      <th className="border-0">{t('category')}</th>
                      <th className="border-0">{t('date')}</th>
                      <th className="border-0 text-end">{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.recent || []).map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="fw-bold">{transaction.description}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {transaction.category}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {formatDateFromSettings(transaction.date)}
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

        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('goals_progress')}</h6>
            </div>
            <div className="card-body">
              {goalsData.goals.length === 0 ? (
                <EmptyState message={t('no_goals')} />
              ) : (
                goalsData.goals.map((goal, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">{goal.name}</span>
                      <span className="text-muted">{goal.progress.toFixed(1)}%</span>
                    </div>
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSpending = () => {
    if (hasNoData && !isLoading) {
    return <EmptyState message={t('no_analytics_data')} />;
  }

  const completeCategories = safeCategories.length > 0 
    ? safeCategories 
    : ensureAllCategories(categoryData.categories);

    return (
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('spending_by_category')}</h6>
            </div>
            <div className="card-body">
  {completeCategories.length === 0 || completeCategories.every(c => c.amount === 0) ? (
    <EmptyState message={t('no_category_data')} />
  ) : (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={completeCategories}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
        <XAxis
          dataKey="category"
          stroke={chartColors.axis}
          tick={{ fill: chartColors.text }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke={chartColors.axis}
          tick={{ fill: chartColors.text }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: chartColors.tooltip,
            border: `1px solid ${chartColors.tooltipBorder}`,
            color: chartColors.text
          }}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {completeCategories.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )}
</div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('monthly_spending_trends')}</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={safeTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="monthYear" 
                    stroke={chartColors.axis} 
                    tick={{ fill: chartColors.text }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke={chartColors.axis} 
                    tick={{ fill: chartColors.text }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalExpenses"
                    stroke="#dc3545"
                    fill="#dc3545"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    name={t('expenses_series')}
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
      <div className="col-12 mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 py-3">
            <h6 className="m-0 fw-bold text-primary">{t('income_trends')}</h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={safeTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="monthYear" 
                  stroke={chartColors.axis} 
                  tick={{ fill: chartColors.text }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke={chartColors.axis} 
                  tick={{ fill: chartColors.text }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalIncome"
                  stroke="#28a745"
                  fill="#28a745"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name={t('income_series')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => {
    const totalGoals = goalsData.summary.totalGoals || 0;
    const completedGoals = goalsData.goals.filter(g => g.progress >= 100).length;
    const overdueGoals = goalsData.summary.overdueGoals || 0;
    const onTrackGoals = totalGoals - completedGoals - overdueGoals;

    return (
      <div className="row">
        <div className="col-12 mb-4">
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-primary text-white mb-3">
                <div className="card-body text-center">
                  <h3 className="card-title">{totalGoals}</h3>
                  <p className="card-text">{t('total_goals')}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white mb-3">
                <div className="card-body text-center">
                  <h3 className="card-title">{onTrackGoals}</h3>
                  <p className="card-text">{t('on_track')}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white mb-3">
                <div className="card-body text-center">
                  <h3 className="card-title">{overdueGoals}</h3>
                  <p className="card-text">{t('overdue')}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white mb-3">
                <div className="card-body text-center">
                  <h3 className="card-title">
                    {Number(goalsData?.summary?.averageProgress ?? 0).toFixed(1)}%
                  </h3>
                  <p className="card-text">{t('avg_progress')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="m-0 fw-bold text-primary">{t('goal_details')}</h6>
            </div>
            <div className="card-body">
              {goalsData.goals.length === 0 ? (
                <EmptyState message={t('no_goals')} />
              ) : (
                <div className="row">
                  {goalsData.goals.map((goal, index) => (
                    <div key={index} className="col-md-6 mb-4">
                      <div className="card border-0 bg-light">
                        <div className="card-body">
                          <h6 className="card-title">{goal.name}</h6>
                          <div className="progress mb-3" style={{ height: '12px' }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${Math.min(goal.progress, 100)}%` }}
                              aria-valuenow={goal.progress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">{t('progress_label')}</span>
                            <span className="fw-bold">{goal.progress.toFixed(1)}%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">{t('saved_label')}</span>
                            <span className="fw-bold text-success">{formatCurrency(goal.savedAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">{t('target_label')}</span>
                            <span className="fw-bold">{formatCurrency(goal.targetAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h3 mb-0 text-gray-800">{t('analytics_dashboard')}</h1>
              <p className="text-muted mb-0">{t('analytics_subtitle')}</p>
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
                    {selectedPeriod === '30days' ? t('last_30_days') :
                      selectedPeriod === '90days' ? t('last_90_days') :
                        selectedPeriod === '1year' ? t('last_year') : t('last_30_days')}
                  </span>
                  <span className="d-inline d-sm-none">
                    {selectedPeriod === '30days' ? '30D' :
                      selectedPeriod === '90days' ? '90D' :
                        selectedPeriod === '1year' ? '1Y' : '30D'}
                  </span>
                </button>
                <ul className="dropdown-menu" aria-labelledby="periodDropdown">
                  <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('30days')}>{t('last_30_days')}</Link></li>
                  <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('90days')}>{t('last_90_days')}</Link></li>
                  <li><Link className="dropdown-item" to="#" onClick={() => setSelectedPeriod('1year')}>{t('last_year')}</Link></li>
                </ul>
              </div>
              <button 
                className="btn btn-outline-secondary w-100 w-sm-auto"
                onClick={handleExportPDF}
              >
                <FaDownload className="me-2" />
                <span className="d-none d-sm-inline">{t('export')}</span>
              </button>
              <button className="btn btn-primary w-100 w-sm-auto" onClick={handleRefresh}>
                <FaSync className={`me-2 ${isLoading ? 'fa-spin' : ''}`} />
                <span className="d-none d-sm-inline">{t('refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FaChartLine className="me-2" />
                {t('overview')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'spending' ? 'active' : ''}`}
                onClick={() => setActiveTab('spending')}
              >
                <FaCreditCard className="me-2" />
                {t('spending')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => setActiveTab('income')}
              >
                <FaWallet className="me-2" />
                {t('income_tab')}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                <FaPiggyBank className="me-2" />
                {t('goals')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;