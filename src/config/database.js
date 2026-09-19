const mongoose = require('mongoose');
const { syncAllStudents } = require('../services/StudentSyncService');

async function connectDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/answer-sheet-valuation';
  await mongoose.connect(uri);
  console.log('Database connected');

  // Automatically ensure all students exist with password 'std123'
  try {
    await syncAllStudents('std123');
  } catch (err) {
    console.error('Failed to auto-sync students:', err);
  }
}

module.exports = { connectDatabase };

