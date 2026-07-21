const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/answer-sheet-valuation';
  await mongoose.connect(uri);
  console.log('Database connected');
}

module.exports = { connectDatabase };
