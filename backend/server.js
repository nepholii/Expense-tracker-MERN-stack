const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();


const User = require('./models/User');

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


async function createAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}


mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker')
  .then(() => {
    console.log('Connected to MongoDB');
    createAdminUser(); 
  })
  .catch((err) => console.log('MongoDB Connection Error:', err));


app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API is working!' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
