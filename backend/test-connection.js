require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection with expensetracker database...');
  
  const safeUri = process.env.MONGODB_URI?.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/, 
    'mongodb+srv://$1:****@'
  );
  console.log('Connection String:', safeUri);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🏠 Host:', mongoose.connection.host);
    
    // Create a test document to verify write permissions
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Test.create({ name: 'connection_test' });
    console.log('✅ Write permissions: OK');
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    process.exit(1);
  }
}

testConnection();