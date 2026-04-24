const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const messageController = require('../controllers/messageController');
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, topicController.getDashboard);
router.get('/topics', authMiddleware, topicController.getAllTopics);
router.post('/topics', authMiddleware, topicController.createTopic);
router.get('/topics/:id', authMiddleware, topicController.getTopicDetail);
router.post('/topics/:id/subscribe', authMiddleware, topicController.subscribeTopic);
router.post('/topics/:id/unsubscribe', authMiddleware, topicController.unsubscribeTopic);
router.post('/topics/:topicId/messages', authMiddleware, messageController.postMessage);
router.post('/messages/:messageId/delete', authMiddleware, messageController.deleteMessage);
router.post('/messages/:messageId/edit', authMiddleware, messageController.editMessage);
router.get('/stats', authMiddleware, statsController.getStats);

module.exports = router;