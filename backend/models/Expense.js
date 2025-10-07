const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  taxType: {
    type: String,
    required: true,
    enum: ['flat', 'percentage'],
    default: 'flat'
  },
  taxAmount: {
    type: Number,
    required: true,
    min: [0, 'Tax amount cannot be negative'],
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});


expenseSchema.pre('save', function(next) {
  console.log('🔄 Calculating totalAmount...');
  console.log('Amount:', this.amount, 'TaxType:', this.taxType, 'TaxAmount:', this.taxAmount);
  
  if (this.taxType === 'percentage') {
    this.totalAmount = this.amount + (this.amount * this.taxAmount / 100);
  } else {
    this.totalAmount = this.amount + this.taxAmount;
  }
  
  console.log('✅ Calculated totalAmount:', this.totalAmount);
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);