import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { 
  FaDollarSign, 
  FaArrowUp, 
  FaArrowDown, 
  // FaTarget,
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
  // FaTrendingUp,
  FaExchangeAlt
} from "react-icons/fa";
import Catagory from "../components/Catagory";
import { recentTransactions, fetchDashboardStats } from "../app/transactionSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const [filterPeriod, setFilterPeriod] = useState("thisMonth");
  
  // Sample data
  const financialSummary = {
    totalBalance: 12750.50,
    monthlyIncome: 4200.00,
    monthlyExpenses: 2850.75,
    goalProgress: 68.5,
    savingsRate: 32.1
  };

  const [ recentTransaction, setRecentTransaction ] = useState([]);
  const [ dashboardData, setDashboardData ] = useState({});

  // Get recent transaction on page lodad
  useEffect(()=>{
    const fetchData = async () => {
    try {
      const result = await dispatch(recentTransactions()).unwrap();
      const dashboard = await dispatch(fetchDashboardStats()).unwrap();
      setRecentTransaction(result);
      setDashboardData(dashboard);
    } catch (error) {
      console.error("Failed to load recent transactions:", error);
    }
  };
  fetchData();
  },[]);
      

  const categorySpending = [
      { category: "Food & Dining", amount: 485.30, percentage: 35, trend: -5.2, color: "warning" },
      { category: "Transportation", amount: 320.15, percentage: 25, trend: 2.1, color: "info" },
      { category: "Shopping", amount: 245.80, percentage: 18, trend: 8.5, color: "danger" },
      { category: "Entertainment", amount: 180.50, percentage: 15, trend: -2.8, color: "secondary" },
      { category: "Utilities", amount: 95.00, percentage: 7, trend: 0.5, color: "dark" }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (transaction) => {
    return transaction.type === 'Income'
    ? <FaArrowUp className="text-success" /> 
    : <FaArrowDown className="text-danger" />;
  };

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
            <div className="d-flex gap-2 align-items-center">
              <select 
                className="form-select form-select-sm"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="thisYear">This Year</option>
              </select>
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
              <p className="text-muted mb-0">Total Balance</p>
              <small className="text-success">
                {/* <FaTrendingUp size={12} className="me-1" /> */}
                +2.5% from last month
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
                On track this month
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
              <small className="text-warning">
                <FaArrowUp size={12} className="me-1" />
                +8% from last month
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-info bg-opacity-10 rounded-circle d-inline-flex">
                  {/* <FaTarget className="text-info" size={24} /> */}
                </div>
              </div>
              <h4 className="fw-bold text-info">{financialSummary.goalProgress}%</h4>
              <p className="text-muted mb-0">Goal Progress</p>
              <small className="text-info">
                <FaChartLine size={12} className="me-1" />
                4 active goals
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
                    {recentTransaction && recentTransaction.map((transaction) => (
                      <tr key={transaction._id}>
                        <td style={{ width: '50px' }}>
                          <div className={`p-2 bg-${transaction.color} bg-opacity-10 rounded-circle d-inline-flex`}>
                            {getTransactionIcon(transaction)}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">{transaction.description}</div>
                            <small className="text-muted">{transaction.category}</small>
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
                            {transaction.displayAmount}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Category Spending & Quick Actions */}
        <div className="col-lg-4">
          {/* Category Spending */}
          <Catagory catagoryData={categorySpending}/>
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
