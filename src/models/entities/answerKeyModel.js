const mongoose = require('mongoose');

const answerKeySchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, unique: true },
  pdfUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const AnswerKey = mongoose.model('AnswerKey', answerKeySchema);
module.exports = AnswerKey;
