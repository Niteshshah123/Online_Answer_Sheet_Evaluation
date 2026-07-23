const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
