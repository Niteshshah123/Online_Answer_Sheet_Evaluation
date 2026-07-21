const mongoose = require('mongoose');

const facultyMappingSchema = new mongoose.Schema({
  course: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  section: { type: String, required: true },
  examType: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true }
});

const FacultyMapping = mongoose.model('FacultyMapping', facultyMappingSchema);
module.exports = FacultyMapping;
