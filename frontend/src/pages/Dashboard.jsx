import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalRecords: 0
  });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard mounted, fetching data...');
    fetchDashboardData();
    fetchExpenses();
  }, [currentPage]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await axios.get('http://localhost:5000/api/expenses/dashboard');
      console.log('Dashboard data:', response.data);
      setStats(response.data.data || response.data);
    } catch (error) {
      console.error(' Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const fetchExpenses = async () => {
    try {
      console.log('Fetching expenses...');
      const response = await axios.get(`http://localhost:5000/api/expenses?page=${currentPage}&limit=5`);
      console.log('Expenses data:', response.data);
      setExpenses(response.data.data?.expenses || response.data.expenses || []);
      setTotalPages(response.data.data?.totalPages || response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`);
        fetchDashboardData();
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting transaction. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Unable to Load Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Expense Tracker Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-card income">
          <h3>Total Income</h3>
          <p>${stats.totalIncome?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card expense">
          <h3>Total Expenses</h3>
          <p>${stats.totalExpense?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card balance">
          <h3>Balance</h3>
          <p>${stats.balance?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card records">
          <h3>Total Records</h3>
          <p>{stats.totalRecords || 0}</p>
        </div>
      </div>

      <div className="expenses-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <button 
            onClick={() => navigate('/add-expense')} 
            className="add-button"
          >
            Add New Transaction
          </button>
        </div>

        <div className="expenses-list">
          {expenses.length === 0 ? (
            <div className="no-expenses">
              <p>No transactions yet. Add your first transaction!</p>
              <button 
                onClick={() => navigate('/add-expense')} 
                className="add-button"
              >
                Add Your First Transaction
              </button>
            </div>
          ) : (
            expenses.map(expense => (
              <div key={expense._id} className={`expense-item ${expense.type}`}>
                <div className="expense-info">
                  <h4>{expense.description}</h4>
                  <div className="expense-details">
                    <p><strong>Amount:</strong> ${expense.amount?.toFixed(2)}</p>
                    <p><strong>Type:</strong> 
                      <span className={`type-badge ${expense.type}`}>
                        {expense.type}
                      </span>
                    </p>
                    <p><strong>Tax:</strong> {expense.taxType === 'flat' ? `$${expense.taxAmount}` : `${expense.taxAmount}%`}</p>
                    <p><strong>Total:</strong> ${expense.totalAmount?.toFixed(2)}</p>
                    <p><strong>Date:</strong> {new Date(expense.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="expense-actions">
                  <button 
                    onClick={() => navigate(`/edit-expense/${expense._id}`)}
                    className="edit-btn"
                  >
                     Edit
                  </button>
                  <button 
                    onClick={() => deleteExpense(expense._id)}
                    className="delete-btn"
                  >
                     Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {expenses.length > 0 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagination-btn"
            >
              ◀ Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagination-btn"
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;