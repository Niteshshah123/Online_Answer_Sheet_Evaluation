const AppError = require('../exceptions/AppError');
const { verifyToken } = require('../security/jwt');
const User = require('../models/entities/userModel');

async function studentAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid token', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'STUDENT') {
      throw new AppError('Access denied', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = studentAuthMiddleware;
