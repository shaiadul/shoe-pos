const User = require('../models/User');
const logActivity = require('../utils/logActivity');
const logger = require('../utils/logger');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, store: user.store }
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, store } = req.body;
    const user = await User.create({ name, email, password, role, phone, store });

    logActivity({
      action: 'USER_CREATED',
      description: `Created user account for "${user.name}" (${user.email}) as ${user.role}`,
      user: req.user,
      entityType: 'User',
      entityId: user._id,
      metadata: { role: user.role, email: user.email },
      ip: req.ip,
    });

    sendToken(user, 201, res);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      logActivity({
        action: 'LOGIN_FAILED',
        description: `Failed login attempt for ${email}`,
        entityType: 'Auth',
        metadata: { email, reason: !user ? 'User not found' : 'Account deactivated' },
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logActivity({
        action: 'LOGIN_FAILED',
        description: `Failed login password attempt for ${email}`,
        user,
        entityType: 'Auth',
        entityId: user._id,
        metadata: { email, reason: 'Incorrect password' },
        ip: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
      ip: req.ip,
    });

    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone, avatar }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!await user.matchPassword(currentPassword)) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();

    logActivity({
      action: 'USER_UPDATED',
      description: `${user.name} changed their password`,
      user,
      entityType: 'User',
      entityId: user._id,
      ip: req.ip,
    });

    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logActivity({
      action: 'USER_UPDATED',
      description: `Updated user profile/roles for "${user.name}"`,
      user: req.user,
      entityType: 'User',
      entityId: user._id,
      metadata: { changes: Object.keys(req.body) },
      ip: req.ip,
    });

    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (user) {
      logActivity({
        action: 'USER_DELETED',
        description: `Deleted user "${user.name}" (${user.email})`,
        user: req.user,
        entityType: 'User',
        entityId: user._id,
        ip: req.ip,
      });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};
