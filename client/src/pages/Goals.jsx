import React, { useState } from "react";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  // FaTarget, 
  FaDollarSign, 
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock
} from "react-icons/fa";

export default function Goals() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Emergency Fund",
      targetAmount: 10000,
      savedAmount: 6500,
      targetDate: "2024-12-31",
      priority: "high",
      category: "Savings",
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Vacation to Europe",
      targetAmount: 5000,
      savedAmount: 2800,
      targetDate: "2024-08-15",
      priority: "medium",
      category: "Travel",
      createdDate: "2024-02-01"
    },
    {
      id: 3,
      title: "New Laptop",
      targetAmount: 2500,
      savedAmount: 2500,
      targetDate: "2024-06-01",
      priority: "low",
      category: "Technology",
      createdDate: "2024-03-10"
    },
    {
      id: 4,
      title: "Car Down Payment",
      targetAmount: 15000,
      savedAmount: 4200,
      targetDate: "2024-10-31",
      priority: "high",
      category: "Transportation",
      createdDate: "2024-01-20"
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    targetDate: "",
    priority: "medium",
    category: ""
  });

  const categories = ["Savings", "Travel", "Technology", "Transportation", "Education", "Health", "Home", "Other"];
  const priorityColors = {
    high: "danger",
    medium: "warning", 
    low: "success"
  };

  const getProgressPercentage = (saved, target) => {
    return Math.min((saved / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "warning";
    return "danger";
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (goal) => {
    const percentage = getProgressPercentage(goal.savedAmount, goal.targetAmount);
    const daysRemaining = getDaysRemaining(goal.targetDate);
    
    if (percentage >= 100) {
      return <FaCheckCircle className="text-success" />;
    } else if (daysRemaining < 30 && percentage < 75) {
      return <FaExclamationTriangle className="text-warning" />;
    } else {
      return <FaClock className="text-info" />;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetAmount) return;

    const goalData = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      savedAmount: 0,
      id: editingGoal ? editingGoal.id : Date.now(),
      createdDate: editingGoal ? editingGoal.createdDate : new Date().toISOString().split('T')[0]
    };

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? {...goalData, savedAmount: editingGoal.savedAmount} : g));
    } else {
      setGoals(prev => [...prev, goalData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      targetAmount: "",
      targetDate: "",
      priority: "medium",
      category: ""
    });
    setEditingGoal(null);
    setShowAddModal(false);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      priority: goal.priority,
      category: goal.category
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleAddFunds = (goal) => {
    setSelectedGoal(goal);
    setAddFundsAmount("");
    setShowAddFundsModal(true);
  };

  const submitAddFunds = (e) => {
    e.preventDefault();
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) return;

    const amount = parseFloat(addFundsAmount);
    setGoals(prev => prev.map(g => 
      g.id === selectedGoal.id 
        ? {...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount)}
        : g
    ));

    setShowAddFundsModal(false);
    setSelectedGoal(null);
    setAddFundsAmount("");
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

  const completedGoals = goals.filter(g => getProgressPercentage(g.savedAmount, g.targetAmount) >= 100);
  const activeGoals = goals.filter(g => getProgressPercentage(g.savedAmount, g.targetAmount) < 100);

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Financial Goals</h4>
              <p className="text-muted mb-0">Track your savings goals and progress</p>
            </div>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus size={14} />
              Add New Goal
            </button>
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
                  {/* <FaTarget className="text-primary" size={24} /> */}
                </div>
              </div>
              <h5 className="fw-bold">{goals.length}</h5>
              <p className="text-muted mb-0">Total Goals</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-success bg-opacity-10 rounded-circle d-inline-flex">
                  <FaCheckCircle className="text-success" size={24} />
                </div>
              </div>
              <h5 className="fw-bold">{completedGoals.length}</h5>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-info bg-opacity-10 rounded-circle d-inline-flex">
                  <FaDollarSign className="text-info" size={24} />
                </div>
              </div>
              <h5 className="fw-bold">{formatCurrency(goals.reduce((sum, g) => sum + g.savedAmount, 0))}</h5>
              <p className="text-muted mb-0">Total Saved</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="p-3 bg-warning bg-opacity-10 rounded-circle d-inline-flex">
                  {/* <FaTarget className="text-warning" size={24} /> */}
                </div>
              </div>
              <h5 className="fw-bold">{formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}</h5>
              <p className="text-muted mb-0">Total Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">Active Goals</h5>
            <div className="row g-3">
              {activeGoals.map((goal) => {
                const percentage = getProgressPercentage(goal.savedAmount, goal.targetAmount);
                const daysRemaining = getDaysRemaining(goal.targetDate);
                const progressColor = getProgressColor(percentage);
                
                return (
                  <div key={goal.id} className="col-lg-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {getStatusIcon(goal)}
                              <h6 className="mb-0 fw-bold">{goal.title}</h6>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <span className={`badge bg-${priorityColors[goal.priority]} bg-opacity-10 text-${priorityColors[goal.priority]} text-capitalize`}>
                                {goal.priority}
                              </span>
                              <small className="text-muted">{goal.category}</small>
                            </div>
                          </div>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                              Actions
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button className="dropdown-item" onClick={() => handleAddFunds(goal)}>
                                  <FaPlus className="me-2" size={12} />
                                  Add Funds
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleEdit(goal)}>
                                  <FaEdit className="me-2" size={12} />
                                  Edit Goal
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => handleDelete(goal.id)}>
                                  <FaTrash className="me-2" size={12} />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted">Progress</span>
                            <span className="fw-medium">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar bg-${progressColor}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <div className="text-center p-2 bg-light rounded">
                              <div className="fw-bold text-success">{formatCurrency(goal.savedAmount)}</div>
                              <small className="text-muted">Saved</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-2 bg-light rounded">
                              <div className="fw-bold text-primary">{formatCurrency(goal.targetAmount)}</div>
                              <small className="text-muted">Target</small>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-sm">
                          <div className="d-flex align-items-center text-muted">
                            <FaCalendarAlt className="me-1" size={12} />
                            <small>{formatDate(goal.targetDate)}</small>
                          </div>
                          <div className={`text-${daysRemaining < 30 ? 'danger' : 'muted'}`}>
                            <small>
                              {daysRemaining > 0 
                                ? `${daysRemaining} days left`
                                : daysRemaining === 0 
                                  ? 'Due today'
                                  : `${Math.abs(daysRemaining)} days overdue`
                              }
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="row">
          <div className="col-12">
            <h5 className="mb-3 text-success">Completed Goals 🎉</h5>
            <div className="row g-3">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="col-lg-6 col-xl-4">
                  <div className="card border-success border-opacity-25 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FaCheckCircle className="text-success" />
                            <h6 className="mb-0 fw-bold">{goal.title}</h6>
                          </div>
                          <small className="text-muted">{goal.category}</small>
                        </div>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Actions
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button className="dropdown-item" onClick={() => handleEdit(goal)}>
                                <FaEdit className="me-2" size={12} />
                                Edit Goal
                              </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => handleDelete(goal.id)}>
                                <FaTrash className="me-2" size={12} />
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                        </div>
                      </div>

                      <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                        <div className="fw-bold text-success">{formatCurrency(goal.targetAmount)}</div>
                        <small className="text-success">Goal Achieved!</small>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="d-flex align-items-center text-muted">
                          <FaCalendarAlt className="me-1" size={12} />
                          <small>Completed: {formatDate(goal.targetDate)}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="mb-4">
                {/* <FaTarget size={64} className="text-muted opacity-50" /> */}
              </div>
              <h5>No Goals Yet</h5>
              <p className="text-muted mb-4">Start by creating your first financial goal to track your progress.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-2" />
                Create Your First Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingGoal ? 'Edit Goal' : 'Add New Goal'}
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
                      <label className="form-label">Goal Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g., Emergency Fund, New Car, Vacation"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Target Amount</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.targetAmount}
                          onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Target Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
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
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
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
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && selectedGoal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Funds</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddFundsModal(false)}
                ></button>
              </div>
              <form onSubmit={submitAddFunds}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Goal: {selectedGoal.title}</label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount to Add</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={addFundsAmount}
                        onChange={(e) => setAddFundsAmount(e.target.value)}
                        max={selectedGoal.targetAmount - selectedGoal.savedAmount}
                        required
                      />
                    </div>
                    <div className="form-text">
                      Remaining: {formatCurrency(selectedGoal.targetAmount - selectedGoal.savedAmount)}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddFundsModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Funds
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