const mongoose = require('mongoose');

const answerSheetSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  pdfUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

answerSheetSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);
module.exports = AnswerSheet;
