require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/entities/userModel');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/online_valuation';
const adminEmail = 'admin@gmail.com';
const adminPassword = 'admin123';

async function seed() {
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB. Clearing the database...');

  await mongoose.connection.dropDatabase();

  await User.create({
    role: 'ADMIN',
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 10),
    name: 'System Administrator'
  });

  console.log('Database reset complete. Created the only user:');
  console.log(`ADMIN | ${adminEmail} | ${adminPassword}`);
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
