const express = require('express');
const studentService = require('../services/StudentService');
const studentAuthMiddleware = require('../middleware/studentAuthMiddleware');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await studentService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', studentAuthMiddleware, async (req, res, next) => {
  try {
    const result = await studentService.getDashboard(req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/:sheetId', studentAuthMiddleware, async (req, res, next) => {
  try {
    const result = await studentService.getReport(req.user.email, req.params.sheetId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', studentAuthMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await studentService.changePassword(req.user.email, oldPassword, newPassword);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Raise Hand / Doubts
const doubtService = require('../services/DoubtService');

router.post('/doubts', studentAuthMiddleware, async (req, res, next) => {
  try {
    const { sheetId, questionNumber, category, comment } = req.body;
    const result = await doubtService.raiseDoubt({
      studentEmail: req.user.email,
      sheetId,
      questionNumber,
      category,
      comment
    });
    res.json({ success: true, message: 'Doubt submitted successfully', data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/doubts', studentAuthMiddleware, async (req, res, next) => {
  try {
    const result = await doubtService.getStudentDoubts(req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/doubts/sheet/:sheetId', studentAuthMiddleware, async (req, res, next) => {
  try {
    const result = await doubtService.getStudentDoubts(req.user.email, req.params.sheetId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/doubts/:doubtId/follow-up', studentAuthMiddleware, async (req, res, next) => {
  try {
    const { followUpComment } = req.body;
    const result = await doubtService.followUpDoubt({
      studentEmail: req.user.email,
      doubtId: req.params.doubtId,
      followUpComment
    });
    res.json({ success: true, message: 'Follow-up submitted successfully', data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
