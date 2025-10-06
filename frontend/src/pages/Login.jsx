

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Login attempt started...');
    console.log('Email:', formData.email);
    
    const result = await login(formData.email, formData.password);
    
    console.log(' Login result:', result);
    console.log('User data:', result.user);
    console.log('User role:', result.user?.role);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('Login successful, navigating...');
      
     
      if (result.user?.role === 'admin') {
        console.log('Redirecting to ADMIN dashboard');
        navigate('/admin');
      } else {
        console.log('Redirecting to USER dashboard');
        navigate('/dashboard');
      }
      
      console.log('Navigation command sent');
    } else {
      console.log('Login failed:', result.message);
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login to Expense Tracker</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;