import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalIncome: 0,
    totalExpenseAmount: 0,
    recentActivity: []
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "user",
    password: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    taxType: "flat",
    taxAmount: "0",
    userId: ""
  });

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    role: "user",
  });

  const [editExpenseForm, setEditExpenseForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    taxType: "flat",
    taxAmount: "0",
  });

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchAllExpenses();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [users, allExpenses]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/expenses/admin/users"); // ✅ FIXED
      setUsers(response.data.data?.users || response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAllExpenses = async () => {
    try {
      const response = await axios.get("/api/expenses/admin/all-expenses"); // ✅ FIXED
      setAllExpenses(response.data.data?.expenses || response.data.expenses || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching all expenses:", error);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalUsers = users.length;
    const totalExpenses = allExpenses.length;
    const totalIncome = allExpenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
    
    const totalExpenseAmount = allExpenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);

    const recentActivity = [...allExpenses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    setStats({
      totalUsers,
      totalExpenses,
      totalIncome,
      totalExpenseAmount,
      recentActivity
    });
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/auth/register", userForm); // ✅ FIXED
      if (response.data.success) {
        setShowUserForm(false);
        setUserForm({ name: "", email: "", role: "user", password: "" });
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error creating user");
    }
  };

  const createExpense = async (e) => {
    e.preventDefault();
    try {
      const totalAmount = calculateTotal(expenseForm);
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        taxAmount: parseFloat(expenseForm.taxAmount),
        totalAmount: totalAmount,
      };

      const response = await axios.post("/api/expenses/admin/create", expenseData); // ✅ FIXED
      if (response.data.success) {
        setShowExpenseForm(false);
        setExpenseForm({ 
          description: "", 
          amount: "", 
          type: "expense", 
          taxType: "flat", 
          taxAmount: "0", 
          userId: "" 
        });
        fetchAllExpenses();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error creating expense");
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user._id);
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/api/expenses/admin/users/${editingUser}`, // ✅ FIXED
        editUserForm
      );
      if (response.data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating user");
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their expenses.`)) {
      try {
        const response = await axios.delete(`/api/expenses/admin/users/${userId}`); // ✅ FIXED
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        alert(error.response?.data?.message || "Error deleting user");
      }
    }
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense._id);
    setEditExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      type: expense.type,
      taxType: expense.taxType || "flat",
      taxAmount: expense.taxAmount?.toString() || "0",
    });
  };

  const updateExpense = async (e) => {
    e.preventDefault();
    try {
      const totalAmount = calculateTotal(editExpenseForm);
      const expenseData = {
        ...editExpenseForm,
        amount: parseFloat(editExpenseForm.amount),
        taxAmount: parseFloat(editExpenseForm.taxAmount),
        totalAmount: totalAmount,
      };

      const response = await axios.put(
        `/api/expenses/admin/expense/${editingExpense}`, // ✅ FIXED
        expenseData
      );
      if (response.data.success) {
        setEditingExpense(null);
        fetchAllExpenses();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating expense");
    }
  };

  const deleteExpense = async (expenseId, description) => {
    if (window.confirm(`Are you sure you want to delete expense "${description}"?`)) {
      try {
        const response = await axios.delete(`/api/expenses/admin/expense/${expenseId}`); // ✅ FIXED
        if (response.data.success) {
          fetchAllExpenses();
        }
      } catch (error) {
        alert(error.response?.data?.message || "Error deleting expense");
      }
    }
  };

  const calculateTotal = (formData) => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;

    if (formData.taxType === "percentage") {
      return amount + (amount * tax) / 100;
    } else {
      return amount + tax;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="nav-brand">
          <h2>ExpenseTracker</h2>
          <span className="admin-badge">ADMIN</span>
        </div>
        
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="tab-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span className="tab-icon">👥</span>
            Users
            <span className="tab-count">{users.length}</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === "expenses" ? "active" : ""}`}
            onClick={() => setActiveTab("expenses")}
          >
            <span className="tab-icon">💰</span>
            Expenses
            <span className="tab-count">{allExpenses.length}</span>
          </button>
        </div>

        <div className="nav-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{user?.name}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <div className="admin-main">
        <header className="content-header">
          <h1>
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "users" && "User Management"}
            {activeTab === "expenses" && "Expense Management"}
          </h1>
          <div className="header-actions">
            {activeTab === "users" && (
              <button 
                onClick={() => setShowUserForm(true)}
                className="btn-primary"
              >
                + Add User
              </button>
            )}
            {activeTab === "expenses" && (
              <button 
                onClick={() => setShowExpenseForm(true)}
                className="btn-primary"
              >
                + Add Expense
              </button>
            )}
          </div>
        </header>

        <div className="admin-content">
          {activeTab === "dashboard" && (
            <div className="dashboard-overview">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">👥</div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon expenses">💰</div>
                  <div className="stat-info">
                    <h3>{stats.totalExpenses}</h3>
                    <p>Total Transactions</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon income">📈</div>
                  <div className="stat-info">
                    <h3>${stats.totalIncome.toFixed(2)}</h3>
                    <p>Total Income</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon expense">📉</div>
                  <div className="stat-info">
                    <h3>${stats.totalExpenseAmount.toFixed(2)}</h3>
                    <p>Total Expenses</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-content">
                <div className="recent-activity">
                  <h2>Recent Activity</h2>
                  <div className="activity-list">
                    {stats.recentActivity.map(activity => (
                      <div key={activity._id} className="activity-item">
                        <div className="activity-icon">
                          {activity.type === 'income' ? '📈' : '📉'}
                        </div>
                        <div className="activity-details">
                          <p className="activity-description">{activity.description}</p>
                          <span className="activity-user">{activity.userId?.name}</span>
                        </div>
                        <div className="activity-amount">
                          <span className={`amount ${activity.type}`}>
                            ${activity.totalAmount?.toFixed(2)}
                          </span>
                          <span className="activity-date">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="quick-stats">
                  <h2>Quick Stats</h2>
                  <div className="stats-cards">
                    <div className="quick-stat">
                      <span className="stat-label">Active Users</span>
                      <span className="stat-value">{users.length}</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Today's Transactions</span>
                      <span className="stat-value">
                        {allExpenses.filter(exp => 
                          new Date(exp.createdAt).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">This Month</span>
                      <span className="stat-value">
                        {allExpenses.filter(exp => 
                          new Date(exp.createdAt).getMonth() === new Date().getMonth()
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="management-section">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => user.role === "user") 
                      .map(user => (
                        <tr key={user._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar small">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              {user.name}
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-edit"
                                onClick={() => openEditUser(user)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn-delete"
                                onClick={() => deleteUser(user._id, user.name)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
                
                {users.filter(user => user.role === "user").length === 0 && (
                  <div className="no-data-message">
                    <p>No regular users found in the system.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="management-section">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allExpenses.map(expense => (
                      <tr key={expense._id}>
                        <td>{expense.description}</td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar small">
                              {expense.userId?.name?.charAt(0).toUpperCase()}
                            </div>
                            {expense.userId?.name}
                          </div>
                        </td>
                        <td>${expense.amount}</td>
                        <td>
                          <span className={`type-badge ${expense.type}`}>
                            {expense.type}
                          </span>
                        </td>
                        <td>${expense.totalAmount?.toFixed(2)}</td>
                        <td>{new Date(expense.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-edit"
                              onClick={() => openEditExpense(expense)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => deleteExpense(expense._id, expense.description)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button onClick={() => setShowUserForm(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={createUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUserForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Expense</h3>
              <button onClick={() => setShowExpenseForm(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={createExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label>User *</label>
                  <select
                    value={expenseForm.userId}
                    onChange={(e) => setExpenseForm({...expenseForm, userId: e.target.value})}
                    required
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowExpenseForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="modal-close">×</button>
            </div>
            <form onSubmit={updateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={editUserForm.name}
                    onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExpense && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="modal-close">×</button>
            </div>
            <form onSubmit={updateExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={editExpenseForm.description}
                    onChange={(e) => setEditExpenseForm({...editExpenseForm, description: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Amount ($) *</label>
                  <input
                    type="number"
                    value={editExpenseForm.amount}
                    onChange={(e) => setEditExpenseForm({...editExpenseForm, amount: e.target.value})}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={editExpenseForm.type}
                    onChange={(e) => setEditExpenseForm({...editExpenseForm, type: e.target.value})}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingExpense(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;