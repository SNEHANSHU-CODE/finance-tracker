import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { 
  FaDollarSign, 
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine,
  FaWallet,
  FaShoppingCart,
  FaCar,
  FaHome,
  FaUtensils,
  FaGamepad,
  FaEllipsisV,
  FaFilter,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaCreditCard,
  FaPiggyBank,
  FaExchangeAlt,
  FaExclamationTriangle
} from "react-icons/fa";
import Catagory from "../components/Catagory";
import { recentTransactions, fetchDashboardStats, fetchCategoryAnalysis } from "../app/transactionSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  
  // State management
  const [recentTransaction, setRecentTransaction] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dashboardData, setDashboardData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get Redux state for additional debugging
  const transactionState = useSelector(state => state.transactions || {});

  // Enhanced useEffect with comprehensive error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if dispatch functions exist
        if (typeof recentTransactions !== 'function') {
          throw new Error('recentTransactions action is not defined');
        }
        if (typeof fetchDashboardStats !== 'function') {
          throw new Error('fetchDashboardStats action is not defined');
        }
        
        // Fetch recent transactions
        const result = await dispatch(recentTransactions()).unwrap();
        
        // Validate recent transactions data
        if (!Array.isArray(result)) {
          setRecentTransaction([]);
        } else {
          setRecentTransaction(result);
        }
        
        // Fetch dashboard stats
        const dashboard = await dispatch(fetchDashboardStats()).unwrap();
        
        // Validate dashboard data structure
        if (!dashboard || typeof dashboard !== 'object') {
          setDashboardData({});
        } else {
          setDashboardData(dashboard);
        }

        // Fetch Catagory data
        const category = await dispatch(fetchCategoryAnalysis()).unwrap();

        // Validate catagory data
        if(!category){
          setCategoryData([]);
          console.log(category);
        }
        else{
          setCategoryData(category);
          console.log(category);
        }
        
      } catch (error) {
        setError(error.message || 'Failed to load dashboard data');
        
        // Set empty defaults on error
        setRecentTransaction([]);
        setDashboardData({});
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Enhanced financial summary with better fallbacks
  const getFinancialSummary = () => {
    
    const defaultSummary = {
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      goalProgress: 0,
      savingsRate: 0
    };

    if (!dashboardData || !dashboardData.monthly || !dashboardData.monthly.summary) {
      console.warn('Missing dashboard data structure for financial summary');
      return defaultSummary;
    }

    const { summary } = dashboardData.monthly;
    
    return {
      totalBalance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
      monthlyIncome: summary.totalIncome || 0,
      monthlyExpenses: summary.totalExpenses || 0,
      goalProgress: 68.5, // Keep as dummy data
      savingsRate: summary.savingsRate || 0
    };
  };

  // Enhanced category spending with better error handling
  const getCategorySpending = () => {
    
    if (!dashboardData || !dashboardData.monthly || !dashboardData.monthly.breakdowns || !dashboardData.monthly.breakdowns.categories) {
      console.warn('Missing category data structure');
      return [];
    }

    const categories = dashboardData.monthly.breakdowns.categories;
    const totalExpenses = dashboardData.monthly.summary?.totalExpenses || 0;
    
    if (totalExpenses === 0) {
      console.warn('Total expenses is 0, cannot calculate percentages');
      return [];
    }
    
    return Object.entries(categories)
      .filter(([_, data]) => data && typeof data === 'object' && data.totalExpenses)
      .map(([categoryName, data]) => ({
        category: categoryName,
        amount: data.totalExpenses || 0,
        percentage: Math.round(((data.totalExpenses || 0) / totalExpenses) * 100),
        trend: 0,
        color: getCategoryColor(categoryName)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  // Helper function to assign colors to categories
  const getCategoryColor = (categoryName) => {
    const colorMap = {
      "Food & Dining": "warning",
      "Transportation": "info",
      "Shopping": "danger",
      "Entertainment": "secondary",
      "Utilities": "dark",
      "Other Expense": "primary",
      "Investment": "success"
    };
    return colorMap[categoryName] || "secondary";
  };

  // Utility functions with null checks
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getTransactionIcon = (transaction) => {
    if (!transaction || !transaction.type) {
      return <FaExchangeAlt className="text-secondary" />;
    }
    return transaction.type === 'Income'
      ? <FaArrowUp className="text-success" /> 
      : <FaArrowDown className="text-danger" />;
  };

  // Format transaction amount with proper sign and null checks
  const formatTransactionAmount = (transaction) => {
    if (!transaction || !transaction.amount) {
      return '$0.00';
    }
    const amount = Math.abs(transaction.amount);
    const sign = transaction.type === 'Income' ? '+' : '-';
    return `${sign}${formatCurrency(amount)}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container-fluid p-0">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-danger m-3" role="alert">
          <div className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2" />
            <div>
              <h4 className="alert-heading mb-1">Error Loading Dashboard</h4>
              <p className="mb-2">{error}</p>
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const financialSummary = getFinancialSummary();

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h4 className="mb-1">Dashboard Overview</h4>
              <p className="text-muted mb-0">Welcome back! Here's your financial summary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-primary bg-opacity-10 rounded-circle d-inline-flex">
                  <FaWallet className="text-primary" size={24} />
                </div>
              </div>
              <h4 className="fw-bold text-primary">{formatCurrency(financialSummary.totalBalance)}</h4>
              <p className="text-muted mb-0">Net Balance</p>
              <small className="text-success">
                {(dashboardData.monthly?.summary?.netSavings || 0) > 0 ? '+' : ''}
                {formatCurrency(dashboardData.monthly?.summary?.netSavings || 0)} this month
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-success bg-opacity-10 rounded-circle d-inline-flex">
                  <FaArrowUp className="text-success" size={24} />
                </div>
              </div>
              <h4 className="fw-bold text-success">{formatCurrency(financialSummary.monthlyIncome)}</h4>
              <p className="text-muted mb-0">Monthly Income</p>
              <small className="text-success">
                <FaArrowUp size={12} className="me-1" />
                {dashboardData.monthly?.summary?.transactionCount || 0} transactions
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-danger bg-opacity-10 rounded-circle d-inline-flex">
                  <FaArrowDown className="text-danger" size={24} />
                </div>
              </div>
              <h4 className="fw-bold text-danger">{formatCurrency(financialSummary.monthlyExpenses)}</h4>
              <p className="text-muted mb-0">Monthly Expenses</p>
              <small className="text-muted">
                <FaArrowDown size={12} className="me-1" />
                Across {categoryData?.categories?.length} categories
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-info bg-opacity-10 rounded-circle d-inline-flex">
                  <FaPiggyBank className="text-info" size={24} />
                </div>
              </div>
              <h4 className="fw-bold text-info">{financialSummary.savingsRate}%</h4>
              <p className="text-muted mb-0">Savings Rate</p>
              <small className="text-info">
                <FaChartLine size={12} className="me-1" />
                {formatCurrency(dashboardData.monthly?.summary?.netSavings || 0)} saved
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Transactions */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Transactions</h5>
                <Link to="/dashboard/transactions" className="btn btn-outline-primary btn-sm">
                  <FaEye size={12} className="me-1" />
                  View All
                </Link>
              </div>
            </div>
            <div className="card-body pt-2">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <tbody>
                    {recentTransaction && recentTransaction.length > 0 ? (
                      recentTransaction.map((transaction, index) => (
                        <tr key={transaction._id || `transaction-${index}`}>
                          <td style={{ width: '50px' }}>
                            <div className={`p-2 bg-${transaction.type === 'Income' ? 'success' : 'danger'} bg-opacity-10 rounded-circle d-inline-flex`}>
                              {getTransactionIcon(transaction)}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{transaction.description || 'No description'}</div>
                              <small className="text-muted">{transaction.category || 'Uncategorized'}</small>
                            </div>
                          </td>
                          <td>
                            <small className="text-muted d-flex align-items-center">
                              <FaCalendarAlt size={10} className="me-1" />
                              {formatDate(transaction.date)}
                            </small>
                          </td>
                          <td className="text-end">
                            <span className={`fw-bold ${transaction.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                              {formatTransactionAmount(transaction)}
                            </span>
                          </td>
                          <td style={{ width: '40px' }}>
                            <div className="dropdown">
                              <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                <FaEllipsisV size={10} />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item">View Details</button></li>
                                <li><button className="dropdown-item">Edit</button></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item text-danger">Delete</button></li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          <FaExclamationTriangle className="me-2" />
                          No recent transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Category Spending & Quick Actions */}
        <div className="col-lg-4">
          {/* Category Spending */}
          {categoryData?.categories?.length > 0 ? (
            <Catagory catagoryData={categoryData.categories} />
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center text-muted py-4">
                <FaChartLine size={48} className="mb-3 opacity-50" />
                <p className="mb-0">No category data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="row g-3 mt-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Savings Rate</h6>
                  <h4 className="fw-bold text-success mb-0">{financialSummary.savingsRate}%</h4>
                  <small className="text-muted">of monthly income</small>
                </div>
                <div className="p-3 bg-success bg-opacity-10 rounded-circle">
                  <FaPiggyBank className="text-success" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Available to Spend</h6>
                  <h4 className="fw-bold text-primary mb-0">
                    {formatCurrency(financialSummary.monthlyIncome - financialSummary.monthlyExpenses)}
                  </h4>
                  <small className="text-muted">remaining this month</small>
                </div>
                <div className="p-3 bg-primary bg-opacity-10 rounded-circle">
                  <FaCreditCard className="text-primary" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
