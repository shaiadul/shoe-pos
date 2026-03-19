const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, getUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, getUsers);
router.post('/register', protect, register);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
