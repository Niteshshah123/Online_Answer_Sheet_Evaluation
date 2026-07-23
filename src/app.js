const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const adminRoutes = require('./controllers/adminController');
const facultyRoutes = require('./controllers/facultyController');
const studentRoutes = require('./controllers/studentController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve uploaded static files (PDFs placed under /public/uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use('/api/admin', upload.single('file'), adminRoutes);
app.use('/api/faculty', upload.single('file'), facultyRoutes);
app.use('/api/student', upload.single('file'), studentRoutes);
app.use(errorHandler);

module.exports = app;
