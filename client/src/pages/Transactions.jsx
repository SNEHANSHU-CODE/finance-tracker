import React, { useState } from "react";
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
  FaSortDown
} from "react-icons/fa";

export default function Transactions() {
  const [transactions, setTransactions] = useState([
    { id: 1, title: "Salary", amount: 5000, type: "income", date: "2024-06-15", category: "Salary" },
    { id: 2, title: "Groceries", amount: -150, type: "expense", date: "2024-06-14", category: "Food" },
    { id: 3, title: "Freelance", amount: 800, type: "income", date: "2024-06-13", category: "Freelance" },
    { id: 4, title: "Utilities", amount: -200, type: "expense", date: "2024-06-12", category: "Utilities" },
    { id: 5, title: "Gas", amount: -75, type: "expense", date: "2024-06-11", category: "Transportation" },
    { id: 6, title: "Bonus", amount: 1200, type: "income", date: "2024-06-10", category: "Bonus" },
    { id: 7, title: "Restaurant", amount: -85, type: "expense", date: "2024-06-09", category: "Food" },
    { id: 8, title: "Investment Return", amount: 450, type: "income", date: "2024-06-08", category: "Investment" }
  ]);

  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    income: ["Salary", "Freelance", "Bonus", "Investment", "Other"],
    expense: ["Food", "Transportation", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"]
  };

  // Filter and sort transactions
  React.useEffect(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesDate = !dateFilter || transaction.date.includes(dateFilter);
      return matchesSearch && matchesType && matchesDate;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        const aValue = Math.abs(a.amount);
        const bValue = Math.abs(b.amount);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else {
        const aValue = a[sortConfig.key].toLowerCase();
        const bValue = b[sortConfig.key].toLowerCase();
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, dateFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const transactionData = {
      ...formData,
      amount: formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
      id: editingTransaction ? editingTransaction.id : Date.now()
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transactionData : t));
    } else {
      setTransactions(prev => [...prev, transactionData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split('T')[0]
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
      date: transaction.date
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
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

  return (
    <div className="container-fluid p-0">
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-2 col-md-3 col-sm-6">
                  <select
                    className="form-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="col-lg-3 col-md-3 col-sm-6">
                  <input
                    type="month"
                    className="form-control"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                <div className="col-lg-3 col-md-12">
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => {
                        setSearchTerm("");
                        setTypeFilter("all");
                        setDateFilter("");
                      }}
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
                <h6 className="mb-0">All Transactions ({filteredTransactions.length})</h6>
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">Sort by:</small>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className={`btn ${sortConfig.key === 'date' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </button>
                    <button 
                      className={`btn ${sortConfig.key === 'amount' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
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
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border-0 ps-4">
                          <div className="d-flex align-items-center">
                            <div className={`p-2 rounded me-3 ${
                              transaction.type === 'income' 
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
                            </div>
                          </div>
                        </td>
                        <td className="border-0">
                          <span className="badge bg-light text-dark">{transaction.category}</span>
                        </td>
                        <td className="border-0 text-muted">{formatDate(transaction.date)}</td>
                        <td className={`border-0 text-end fw-medium ${
                          transaction.amount > 0 ? 'text-success' : 'text-danger'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </td>
                        <td className="border-0 text-center">
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(transaction)}
                            >
                              <FaEdit size={12} />
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      <FaSearch size={48} className="mb-3 opacity-50" />
                      <p>No transactions found matching your criteria.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Type</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value, category: ""})}
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories[formData.type].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
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