const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, getUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema, changePasswordSchema, updateProfileSchema } = require('../validations/authValidation');

router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.get('/users', protect, getUsers);
router.post('/register', protect, validate(registerSchema), register);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
