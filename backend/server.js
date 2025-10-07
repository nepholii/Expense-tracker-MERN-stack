const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');

const app = express();

// ✅ Enhanced CORS setup - FIXED
const allowedOrigins = [
  'http://localhost:5173', // local frontend
  'https://expense-tracker-mern-stack-production.up.railway.app', // deployed frontend
  process.env.CLIENT_URL // from environment variable
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests for all routes - FIXED
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// ✅ Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static files from React frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ✅ Enhanced MongoDB connection with better error handling
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    // Log safe connection string (without password)
    const safeConnectionString = process.env.MONGODB_URI?.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/, 
      'mongodb+srv://$1:****@'
    );
    console.log('Using connection:', safeConnectionString);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    
    // Connection event listeners for better monitoring
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check MONGODB_URI in .env file');
    console.log('2. Verify MongoDB Atlas IP whitelist (0.0.0.0/0)');
    console.log('3. Check database user credentials');
    console.log('4. Ensure cluster is not paused');
    
    process.exit(1);
  }
};

// ✅ Create default admin user if not exists
async function createAdminUser() {
  try {
    console.log('👨‍💼 Checking for admin user...');
    
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
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
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

// ✅ Initialize database connection and admin user
async function initializeApp() {
  try {
    await connectDB();
    await createAdminUser();
    console.log('🚀 Application initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// ✅ API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));

// ✅ Health check route
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// ✅ API test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Expense Tracker API is working!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Database status route
app.get('/api/db-status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    database: states[dbState],
    connection: mongoose.connection.host || 'Not connected',
    databaseName: mongoose.connection.name || 'Not connected',
    timestamp: new Date().toISOString()
  });
});

// ✅ Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Error Stack:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.originalUrl}`
  });
});

// ✅ Catch-all handler for client-side routing - FIXED
// Use explicit route instead of regex with *
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log('\n🎉 Server started successfully!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`🖥️ Frontend: http://localhost:${PORT}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Running in PRODUCTION mode');
    } else {
      console.log('💻 Running in DEVELOPMENT mode');
    }
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Received SIGINT. Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Received SIGTERM. Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});