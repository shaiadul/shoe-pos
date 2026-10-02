const BaseService = require('./BaseService');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');

class AuthService extends BaseService {
  constructor() {
    super(User);
  }

  async register(data, actor, ip) {
    const { name, email, password, role, phone, store } = data;
    const user = await this.model.create({ name, email, password, role, phone, store });

    logActivity({
      action: 'USER_CREATED',
      description: `Created user account for "${user.name}" (${user.email}) as ${user.role}`,
      user: actor,
      entityType: 'User',
      entityId: user._id,
      metadata: { role: user.role, email: user.email },
      ip,
    });

    const token = user.getSignedJwtToken();
    return { user: this._formatUserResponse(user), token };
  }

  async login(email, password, ip) {
    if (!email || !password) {
      const err = new Error('Please provide email and password');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.model.findOne({ email }).select('+password');
    if (!user) {
      logActivity({
        action: 'LOGIN_FAILED',
        description: `Failed login: No account found for ${email}`,
        entityType: 'Auth',
        metadata: { email, reason: 'User not found' },
        ip,
      });
      const err = new Error('No account registered with this email address.');
      err.statusCode = 401;
      err.fieldErrors = { email: 'No account registered with this email' };
      throw err;
    }

    if (!user.isActive) {
      logActivity({
        action: 'LOGIN_FAILED',
        description: `Failed login: Deactivated account for ${email}`,
        entityType: 'Auth',
        metadata: { email, reason: 'Account deactivated' },
        ip,
      });
      const err = new Error('Your account has been deactivated. Please contact an administrator.');
      err.statusCode = 403;
      err.fieldErrors = { email: 'Account is deactivated' };
      throw err;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logActivity({
        action: 'LOGIN_FAILED',
        description: `Failed login: Incorrect password for ${email}`,
        user,
        entityType: 'Auth',
        entityId: user._id,
        metadata: { email, reason: 'Incorrect password' },
        ip,
      });
      const err = new Error('Incorrect password. Please verify and try again.');
      err.statusCode = 401;
      err.fieldErrors = { password: 'Incorrect password' };
      throw err;
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logActivity({
      action: 'LOGIN',
      description: `${user.name} logged into POS`,
      user,
      entityType: 'Auth',
      entityId: user._id,
      metadata: { role: user.role },
      ip,
    });

    const token = user.getSignedJwtToken();
    return { user: this._formatUserResponse(user), token };
  }

  async getMe(userId) {
    return this.model.findById(userId);
  }

  async updateProfile(userId, { name, phone, avatar }) {
    return this.model.findByIdAndUpdate(
      userId,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
  }

  async changePassword(userId, currentPassword, newPassword, ip) {
    const user = await this.model.findById(userId).select('+password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      throw err;
    }

    user.password = newPassword;
    await user.save();

    logActivity({
      action: 'USER_UPDATED',
      description: `${user.name} changed their password`,
      user,
      entityType: 'User',
      entityId: user._id,
      ip,
    });

    const token = user.getSignedJwtToken();
    return { user: this._formatUserResponse(user), token };
  }

  async getUsers() {
    return this.model.find().sort('-createdAt');
  }

  async updateUser(userId, data, actor, ip) {
    const user = await this.model.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    logActivity({
      action: 'USER_UPDATED',
      description: `Updated user profile/roles for "${user.name}"`,
      user: actor,
      entityType: 'User',
      entityId: user._id,
      metadata: { changes: Object.keys(data) },
      ip,
    });

    return user;
  }

  async deleteUser(userId, actor, ip) {
    const user = await this.model.findByIdAndDelete(userId);
    if (user) {
      logActivity({
        action: 'USER_DELETED',
        description: `Deleted user "${user.name}" (${user.email})`,
        user: actor,
        entityType: 'User',
        entityId: user._id,
        ip,
      });
    }
    return user;
  }

  _formatUserResponse(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      store: user.store,
    };
  }
}

module.exports = new AuthService();
