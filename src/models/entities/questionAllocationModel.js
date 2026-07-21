const mongoose = require('mongoose');

const questionAllocationSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  fromQuestion: { type: Number, required: true },
  toQuestion: { type: Number, required: true },
  allocationType: { type: String, default: 'EQUAL' },
  createdAt: { type: Date, default: Date.now }
});

const QuestionAllocation = mongoose.model('QuestionAllocation', questionAllocationSchema);
module.exports = QuestionAllocation;
