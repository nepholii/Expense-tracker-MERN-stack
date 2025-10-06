import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './EditExpense.css';
const EditExpense = () => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    taxType: 'flat',
    taxAmount: '0'
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      console.log('Fetching expense with ID:', id);
      const response = await axios.get(`http://localhost:5000/api/expenses/${id}`);
      console.log(' Expense API response:', response.data);
      
     
      const expense = response.data.data || response.data;
      
      if (!expense) {
        throw new Error('Expense not found in response');
      }
      
      console.log('📝 Expense data:', expense);
      
      setFormData({
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        type: expense.type || 'expense',
        taxType: expense.taxType || 'flat',
        taxAmount: expense.taxAmount?.toString() || '0'
      });
      
    } catch (error) {
      console.error('Error loading expense:', error);
      console.error(' Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Error loading expense. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;
    
    if (formData.taxType === 'percentage') {
      return amount + (amount * tax / 100);
    } else {
      return amount + tax;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totalAmount = calculateTotal();
      
      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        taxType: formData.taxType,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        totalAmount: totalAmount
      };

      console.log('📤 Sending update data:', expenseData);

      const response = await axios.put(`http://localhost:5000/api/expenses/${id}`, expenseData);
      console.log('Update response:', response.data);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating expense:', error);
      console.error(' Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Error updating expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading expense data...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>✏️ Edit Transaction</h2>
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <br />
            <button 
              onClick={fetchExpense}
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Retry Loading
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter description"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Amount ($) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tax Type</label>
            <select
              name="taxType"
              value={formData.taxType}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="flat">Flat Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Tax Amount {formData.taxType === 'percentage' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              name="taxAmount"
              value={formData.taxAmount}
              onChange={handleChange}
              min="0"
              step={formData.taxType === 'percentage' ? '0.1' : '0.01'}
              placeholder="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Total Amount</label>
            <div className="total-amount">
              ${calculateTotal().toFixed(2)}
            </div>
            <small className="total-note">
              Calculated: Amount {formData.taxType === 'percentage' 
                ? `+ ${formData.taxAmount}%` 
                : `+ $${formData.taxAmount}`}
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpense;