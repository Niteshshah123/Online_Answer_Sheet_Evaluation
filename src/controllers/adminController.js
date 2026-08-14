const express = require('express');
const adminFacade = require('../facades/AdminFacade');
const authMiddleware = require('../middleware/authMiddleware');
const AppError = require('../exceptions/AppError');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminFacade.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Teacher management
router.get('/teachers', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.listTeachers();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/teachers', authMiddleware, async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const result = await adminFacade.createTeacher({ email, name, password });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/teachers/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.updateTeacher(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/teachers/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.deleteTeacher(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.getDashboard();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/excel/upload', authMiddleware, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Excel file is required', 400);
    }
    const result = await adminFacade.importExcel(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.getAuditLogs();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/evaluation/unlock', authMiddleware, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await adminFacade.unlockEvaluation(payload, req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/evaluation/unlock/requests', authMiddleware, async (req, res, next) => {
  try {
    const result = await require('../facades/AdminFacade').getUnlockRequests();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/evaluation/unlock/reject', authMiddleware, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await require('../facades/AdminFacade').rejectUnlock(payload, req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/configuration/distribution', authMiddleware, async (req, res, next) => {
  try {
    const { examId, strategyType, allocations } = req.body;
    const result = await adminFacade.configureDistribution(examId, strategyType, allocations);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// List exams with optional filters
router.get('/exams', authMiddleware, async (req, res, next) => {
  try {
    const { course, subject, semester, section, examType } = req.query;
    const ExamRepository = require('../repositories/ExamRepository');
    const filter = {};
    if (course) filter.course = course;
    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    if (section) filter.section = section;
    if (examType) filter.examType = examType;

    const exams = await ExamRepository.findAll(filter);
    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
});

router.post('/exams/:id/publish', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.togglePublishExam(req.params.id, req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', authMiddleware, async (req, res, next) => {
  try {
    const result = await adminFacade.getReports();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
