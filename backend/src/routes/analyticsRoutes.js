const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/admin', verifyToken, requireAdmin, analyticsController.getAdminAnalytics);
router.get('/student', verifyToken, requireStudent, analyticsController.getStudentAnalytics);

module.exports = router;
