const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();



router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email, and password' 
      });
    }

  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }
    
    
    const userData = { 
      name, 
      email, 
      password 
    };
    
    
    if (role && (role === 'admin' || role === 'user')) {
      userData.role = role;
    }
    
    const user = await User.create(userData);
    
    console.log('User created:', user.email);
  
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true, 
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;

 
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }
    
 
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    console.log('Login successful for:', user.email);
    
   
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true, 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(' Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
});

module.exports = router;