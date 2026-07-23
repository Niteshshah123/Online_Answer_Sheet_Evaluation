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

module.exports = router;
