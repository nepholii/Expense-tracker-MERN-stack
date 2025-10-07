const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ------------------ USER ROUTES ------------------ //

// Create a new expense
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, taxType, taxAmount } = req.body;

    const expense = new Expense({
      description,
      amount: Number(amount) || 0,
      type,
      taxType,
      taxAmount: Number(taxAmount) || 0,
      userId: req.user.id
    });

    await expense.save();

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get paginated expenses for a user
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dashboard summary for a user
router.get('/dashboard', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });

    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalExpense = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        totalRecords: expenses.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update expense by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const { description, amount, type, taxType, taxAmount } = req.body;

    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    expense.description = description;
    expense.amount = Number(amount) || 0;
    expense.type = type;
    expense.taxType = taxType;
    expense.taxAmount = Number(taxAmount) || 0;

    await expense.save();

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete expense by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------ ADMIN ROUTES ------------------ //

// Get all users
router.get('/admin/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const users = await User.find().select('-password');
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a user (admin)
router.put('/admin/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const { name, email, role } = req.body;
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete user + their expenses (admin)
router.delete('/admin/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Expense.deleteMany({ userId: req.params.id });
    res.json({ success: true, message: 'User and their expenses deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all expenses (admin)
router.get('/admin/all-expenses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const expenses = await Expense.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: { expenses } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update expense (admin)
router.put('/admin/expense/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const { description, amount, type, taxType, taxAmount, totalAmount } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { description, amount, type, taxType, taxAmount, totalAmount },
      { new: true }
    ).populate('userId', 'name email');

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete expense (admin)
router.delete('/admin/expense/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access only' });

    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
