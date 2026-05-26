const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const messageController = require('../controllers/messageController');
const notificationController = require('../controllers/notificationController');
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const voteController = require('../controllers/voteController');
const profileController = require('../controllers/profileController');
const Message = require('../models/Message'); 
const User = require('../models/User');

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
router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.post('/notifications/read', authMiddleware, notificationController.markAllRead);
router.post('/notifications/:id/read', authMiddleware, notificationController.markOneRead);
router.post('/messages/:messageId/upvote', authMiddleware, voteController.upvoteMessage);
router.post('/messages/:messageId/downvote', authMiddleware, voteController.downvoteMessage);

// ← add this route for vote counts
router.get('/messages/:messageId/votes', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        const userId = req.session.userId.toString();
        res.json({
            upvotes: message.upvotes.length,
            downvotes: message.downvotes.length,
            userUpvoted: message.upvotes.map(id => id.toString()).includes(userId),
            userDownvoted: message.downvotes.map(id => id.toString()).includes(userId)
        });
    } catch(err) {
        res.json({ upvotes: 0, downvotes: 0, userUpvoted: false, userDownvoted: false });
    }
});

router.get('/profile/:username', authMiddleware, profileController.getProfile);
router.post('/users/:userId/follow', authMiddleware, profileController.followUser);
router.post('/profile/update', authMiddleware, profileController.updateProfile);

router.post('/profile/avatar', authMiddleware, async (req, res) => {
    try {
        const { avatar } = req.body;

        // Basic validation
        if (!avatar || !avatar.startsWith('data:image')) {
            return res.json({ success: false, error: 'Invalid image' });
        }

        // Save base64 image directly to MongoDB
        await User.findByIdAndUpdate(req.session.userId, { avatar });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});
module.exports = router;