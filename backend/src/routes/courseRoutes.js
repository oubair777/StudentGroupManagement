const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, courseController.getAllCourses);
router.get('/:id', verifyToken, courseController.getCourseById);
router.post('/', verifyToken, requireAdmin, courseController.createCourse);
router.post('/:courseId/enroll', verifyToken, courseController.enrollStudent);

module.exports = router;
