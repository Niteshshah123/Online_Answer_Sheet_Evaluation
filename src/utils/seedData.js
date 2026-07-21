const bcrypt = require('bcryptjs');
const User = require('../models/entities/userModel');

async function seedData() {
  const existingAdmin = await User.findOne({ email: 'admin@example.com' });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      role: 'ADMIN',
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin'
    });
    console.log('Seeded admin user: admin@example.com / admin123');
  }
}

module.exports = seedData;
