const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');

const app = express();

// ✅ Simple CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://expense-tracker-mern-stack-production.up.railway.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static files from React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ✅ Enhanced MongoDB connection
const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });

    console.log('✅ MongoDB Connected!');
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// ✅ Create default admin user
async function createAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('✅ Admin user exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

// ✅ Initialize app
async function initializeApp() {
  await connectDB();
  await createAdminUser();
  console.log('🚀 App initialized!');
}

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));

// ✅ Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ✅ API test
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Expense Tracker API is working!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Database status
app.get('/api/db-status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    database: states[dbState],
    connection: mongoose.connection.host || 'Not connected'
  });
});

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }
  
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

// ✅ FIXED: 404 handler for API routes - Use function instead of route
app.use('/api', (req, res, next) => {
  // If we get here, no API route matched
  if (!req.route) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.originalUrl}`
    });
  }
  next();
});

// ✅ Catch-all for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎉 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});