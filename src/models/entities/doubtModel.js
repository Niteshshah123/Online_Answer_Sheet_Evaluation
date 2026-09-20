const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnswerSheet', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', default: null },
  questionNumber: { type: Number, default: null },
  category: {
    type: String,
    enum: ['DOUBT', 'MARKS_CALCULATION', 'UNCHECKED_PART', 'REEVALUATION', 'OTHER'],
    default: 'DOUBT'
  },
  comment: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'],
    default: 'PENDING'
  },
  teacherReply: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

const Doubt = mongoose.model('Doubt', doubtSchema);
module.exports = Doubt;
