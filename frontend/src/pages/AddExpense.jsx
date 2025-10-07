import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Add this at the top
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AddExpense = () => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    taxType: "flat",
    taxAmount: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;

    if (formData.taxType === "percentage") {
      return amount + (amount * tax) / 100;
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

    console.log('Sending expense data:', expenseData);

    const response = await axios.post(`${API_BASE_URL}/api/expenses`, expenseData);
    
    console.log('✅ Expense added successfully:', response.data);
    

    navigate('/dashboard');
    
  } catch (error) {
    console.error('❌ Error adding expense:', error);
    
    if (error.response) {
      setError(error.response.data?.message || `Server error: ${error.response.status}`);
    } else if (error.request) {
      setError('Server is not responding. Please check if the backend is running.');
    } else {
      setError(error.message || 'Error adding expense');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>➕ Add New Transaction</h2>
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
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
              Tax Amount {formData.taxType === "percentage" ? "(%)" : "($)"}
            </label>
            <input
              type="number"
              name="taxAmount"
              value={formData.taxAmount}
              onChange={handleChange}
              min="0"
              step={formData.taxType === "percentage" ? "0.1" : "0.01"}
              placeholder="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Total Amount</label>
            <div className="total-amount">${calculateTotal().toFixed(2)}</div>
            <small className="total-note">
              Calculated: Amount{" "}
              {formData.taxType === "percentage"
                ? `+ ${formData.taxAmount}%`
                : `+ $${formData.taxAmount}`}
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;