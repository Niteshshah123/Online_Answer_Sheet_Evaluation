const bcrypt = require('bcryptjs');
const AppError = require('../exceptions/AppError');
const User = require('../models/entities/userModel');
const { signToken } = require('../security/jwt');
const AuthResponseDto = require('../dto/response/AuthResponseDto');

class AuthService {
  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken({ userId: user._id, role: user.role });
    return new AuthResponseDto(token, {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  }
}

module.exports = new AuthService();
