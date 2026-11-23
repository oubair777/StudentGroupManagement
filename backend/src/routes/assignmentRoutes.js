const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, assignmentController.getAllAssignments);
router.get('/:id', verifyToken, assignmentController.getAssignmentById);
router.post('/', verifyToken, requireAdmin, assignmentController.createAssignment);
router.put('/:id', verifyToken, requireAdmin, assignmentController.updateAssignment);
router.delete('/:id', verifyToken, requireAdmin, assignmentController.deleteAssignment);

module.exports = router;
