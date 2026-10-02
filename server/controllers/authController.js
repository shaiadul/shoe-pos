const BaseController = require('../core/BaseController');
const authService = require('../services/authService');

class AuthController extends BaseController {
  constructor(service = authService) {
    super();
    this.service = service;
  }

  async register(req, res, next) {
    try {
      const result = await this.service.register(req.body, req.user, req.ip);
      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.service.login(email, password, req.ip);
      return this.sendSuccess(res, result, 200);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          fieldErrors: err.fieldErrors,
        });
      }
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await this.service.getMe(req.user.id);
      return this.sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, phone, avatar } = req.body;
      const user = await this.service.updateProfile(req.user.id, { name, phone, avatar });
      return this.sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await this.service.changePassword(req.user.id, currentPassword, newPassword, req.ip);
      return this.sendSuccess(res, result);
    } catch (err) {
      if (err.statusCode) {
        return this.sendError(res, err.message, err.statusCode);
      }
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await this.service.getUsers();
      return this.sendSuccess(res, { count: users.length, users });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await this.service.updateUser(req.params.id, req.body, req.user, req.ip);
      return this.sendSuccess(res, { user });
    } catch (err) {
      if (err.statusCode) {
        return this.sendError(res, err.message, err.statusCode);
      }
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await this.service.deleteUser(req.params.id, req.user, req.ip);
      return this.sendSuccess(res, { message: 'User deleted' });
    } catch (err) {
      next(err);
    }
  }
}

const authController = new AuthController();

module.exports = authController;
module.exports.AuthController = AuthController;
module.exports.register = authController.register;
module.exports.login = authController.login;
module.exports.getMe = authController.getMe;
module.exports.updateProfile = authController.updateProfile;
module.exports.changePassword = authController.changePassword;
module.exports.getUsers = authController.getUsers;
module.exports.updateUser = authController.updateUser;
module.exports.deleteUser = authController.deleteUser;
