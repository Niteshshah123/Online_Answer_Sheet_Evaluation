const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, default: 'Examination Cell' }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
