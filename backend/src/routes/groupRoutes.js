const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyToken, requireStudent } = require('../middleware/auth');

router.post('/', verifyToken, requireStudent, groupController.createGroup);
router.get('/my', verifyToken, groupController.getMyGroups);
router.get('/', verifyToken, groupController.getAllGroups);
router.get('/:id', verifyToken, groupController.getGroupById);
router.post('/:groupId/members', verifyToken, groupController.addMember);
router.delete('/:groupId/members/:userId', verifyToken, groupController.removeMember);

module.exports = router;
