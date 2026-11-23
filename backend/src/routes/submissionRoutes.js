const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');

router.post('/confirm', verifyToken, requireStudent, submissionController.confirmSubmission);
router.get('/tracker', verifyToken, requireAdmin, submissionController.getSubmissionsTracker);
router.get('/my', verifyToken, submissionController.getMySubmissions);

module.exports = router;
