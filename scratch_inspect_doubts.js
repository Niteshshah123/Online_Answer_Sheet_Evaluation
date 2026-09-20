require('dotenv').config();
const mongoose = require('mongoose');
const Doubt = require('./src/models/entities/doubtModel');
const Faculty = require('./src/models/entities/facultyModel');
const User = require('./src/models/entities/userModel');
const Student = require('./src/models/entities/studentModel');
const Exam = require('./src/models/entities/examModel');
const QuestionEvaluation = require('./src/models/entities/questionEvaluationModel');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- ALL DOUBTS ---');
    const doubts = await Doubt.find({});
    console.log(`Total Doubts: ${doubts.length}`);
    for (const d of doubts) {
      console.log({
        id: d._id,
        sheetId: d.sheetId,
        questionNumber: d.questionNumber,
        facultyId: d.facultyId,
        studentId: d.studentId,
        comment: d.comment,
        status: d.status
      });
    }

    console.log('\n--- ALL FACULTY ---');
    const faculties = await Faculty.find({});
    for (const f of faculties) {
      const u = await User.findById(f.userId);
      console.log({
        facultyId: f._id,
        userId: f.userId,
        name: f.name,
        email: f.email || u?.email
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Scratch error:', err);
    process.exit(1);
  }
})();
