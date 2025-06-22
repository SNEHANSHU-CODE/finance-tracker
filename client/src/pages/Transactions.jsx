import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSpinner
} from "react-icons/fa";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  setFilters,
  clearFilters,
  clearError
} from "../app/transactionSlice";

export default function Transactions() {
  const dispatch = useDispatch();

  // Redux state
  const {
    transactions,
    pagination,
    loading,
    error,
    filters
  } = useSelector(state => state.transaction);

  // Local component state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const categories = {
    income: ["Salary", "Freelance", "Bonus", "Investment", "Other Income"],
    expense: ["Food", "Transportation", "Shopping", "Entertainment", "Utilities", "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense"]
  };

  // Fetch transactions on component mount and when filters change
  useEffect(() => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      ...filters
    };
    dispatch(fetchTransactions(params));
  }, [dispatch, filters, pagination.currentPage]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleSearch = (searchTerm) => {
    handleFilterChange({ searchTerm, currentPage: 1 });
  };

  const handleSort = (sortBy) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFilterChange({ sortBy, sortOrder: newSortOrder });
  };

  const getSortIcon = (key) => {
    if (filters.sortBy !== key) return <FaSort className="text-muted" />;
    return filters.sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const transactionData = {
      description: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type === 'income' ? 'Income' : 'Expense',
      category: formData.category,
      date: formData.date,
      notes: formData.description,
    };

    try {
      if (editingTransaction) {
        await dispatch(updateTransaction({
          id: editingTransaction._id,
          data: transactionData
        })).unwrap();
      } else {
        await dispatch(createTransaction(transactionData)).unwrap();
      }
      resetForm();
      // Refresh transactions after successful operation
      dispatch(fetchTransactions({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      }));
    } catch (error) {
      console.error('Transaction operation failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split('T')[0],
      description: ""
    });
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date.split('T')[0],
      description: transaction.description || ""
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await dispatch(deleteTransaction(id)).unwrap();
        // Refresh transactions after successful deletion
        dispatch(fetchTransactions({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          ...filters
        }));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    dispatch(fetchTransactions({
      page,
      limit: pagination.itemsPerPage,
      ...filters
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
  };

  return (
    <div className="container-fluid p-0">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => dispatch(clearError())}
          ></button>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Transactions</h4>
              <p className="text-muted mb-0">Manage your income and expenses</p>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              <FaPlus size={14} />
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-4 col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <FaSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search transactions..."
                      value={filters.searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <select
                    className="form-select"
                    value={filters.type}
                    onChange={(e) => handleFilterChange({ type: e.target.value })}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <select
                    className="form-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange({ category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    {[...categories.income, ...categories.expense].map((cat, index) => (
                      <option key={`${cat}-${index}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <input
                    type="date"
                    className="form-control"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                  />
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <input
                    type="date"
                    className="form-control"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                  />
                </div>
                <div className="col-lg-12">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={clearAllFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  All Transactions ({pagination.totalItems})
                  {loading && <FaSpinner className="fa-spin ms-2" />}
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">Sort by:</small>
                  <div className="btn-group btn-group-sm">
                    <button
                      className={`btn ${filters.sortBy === 'date' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </button>
                    <button
                      className={`btn ${filters.sortBy === 'amount' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
                    </button>
                    <button
                      className={`btn ${filters.sortBy === 'title' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleSort('title')}
                    >
                      Title {getSortIcon('title')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 ps-4">Transaction</th>
                      <th className="border-0">Category</th>
                      <th className="border-0">Date</th>
                      <th className="border-0 text-end">Amount</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td className="border-0 ps-4">
                          <div className="d-flex align-items-center">
                            <div className={`p-2 rounded me-3 ${transaction.type === 'income'
                                ? 'bg-success bg-opacity-10'
                                : 'bg-danger bg-opacity-10'
                              }`}>
                              {transaction.type === 'income'
                                ? <FaArrowUp className="text-success" size={14} />
                                : <FaArrowDown className="text-danger" size={14} />
                              }
                            </div>
                            <div>
                              <div className="fw-medium">{transaction.title}</div>
                              <small className="text-muted text-capitalize">{transaction.type}</small>
                              {transaction.description && (
                                <div className="small text-muted">{transaction.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="border-0">
                          <span className="badge bg-light text-dark">{transaction.category}</span>
                        </td>
                        <td className="border-0 text-muted">{formatDate(transaction.date)}</td>
                        <td className={`border-0 text-end fw-medium ${transaction.amount > 0 ? 'text-success' : 'text-danger'
                          }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </td>
                        <td className="border-0 text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(transaction)}
                              disabled={loading}
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(transaction._id)}
                              disabled={loading}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && transactions.length === 0 && (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      <FaSearch size={48} className="mb-3 opacity-50" />
                      <p>No transactions found matching your criteria.</p>
                    </div>
                  </div>
                )}
                {loading && transactions.length === 0 && (
                  <div className="text-center py-5">
                    <FaSpinner className="fa-spin" size={48} />
                    <p className="mt-3 text-muted">Loading transactions...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} entries
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1 || loading}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <li key={page} className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(page)}
                              disabled={loading}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages || loading}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                  disabled={loading}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Type</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value, category: "" })}
                        disabled={loading}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categories[formData.type].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={loading}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading && <FaSpinner className="fa-spin me-2" />}
                    {editingTransaction ? 'Update' : 'Add'} Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}