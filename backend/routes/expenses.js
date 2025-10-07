

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, taxType, taxAmount } = req.body;

    let totalAmount;
    if (taxType === 'percentage') {
      totalAmount = amount + (amount * taxAmount / 100);
    } else {
      totalAmount = amount + taxAmount;
    }

    const expense = new Expense({
      description,
      amount,
      type,
      taxType,
      taxAmount: taxAmount || 0,
      totalAmount,
      userId: req.user.id
    });

    await expense.save();
    
    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      data: {
        expenses,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExpenses: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/dashboard', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });
    
    const totalIncome = expenses
      .filter(exp => exp.type === 'income')
      .reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    const totalExpense = expenses
      .filter(exp => exp.type === 'expense')
      .reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    const balance = totalIncome - totalExpense;
    const totalRecords = expenses.length;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        totalRecords
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { description, amount, type, taxType, taxAmount } = req.body;

    let expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    expense.description = description;
    expense.amount = amount;
    expense.type = type;
    expense.taxType = taxType;
    expense.taxAmount = taxAmount || 0;

    await expense.save();

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/admin/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const User = require('../models/User');
    const users = await User.find().select('-password');

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/admin/all-expenses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const expenses = await Expense.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { expenses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.delete('/admin/expense/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/admin/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const User = require('../models/User');
    const { name, email, role } = req.body;

    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/admin/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await Expense.deleteMany({ userId: req.params.id });

    res.json({
      success: true,
      message: 'User and their expenses deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/admin/expense/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { description, amount, type, taxType, taxAmount, totalAmount } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        description,
        amount,
        type,
        taxType,
        taxAmount,
        totalAmount
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;