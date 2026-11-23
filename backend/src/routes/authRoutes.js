const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', verifyToken, authController.getProfile);
router.get('/students', verifyToken, authController.searchStudents);

module.exports = router;
