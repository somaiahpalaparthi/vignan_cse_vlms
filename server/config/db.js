const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vlms');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Non-fatal fallback warning for development environments without running Mongo daemon
    console.log('Running in dev mode. Connect MongoDB instance to enable database persistence.');
  }
};

module.exports = connectDB;
