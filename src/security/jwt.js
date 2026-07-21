const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'super-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key');
}

module.exports = { signToken, verifyToken };
