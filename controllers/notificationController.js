const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for logged in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            user: req.session.userId 
        })
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({ notifications });
    } catch (err) {
        res.json({ notifications: [] });
    }
};

const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.session.userId, isRead: false },
            { isRead: true }
        );

        // Reset unread count to 0
        await User.findByIdAndUpdate(req.session.userId, { 
            unreadCount: 0 
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
};
const markOneRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });

        // Decrease unread count by 1 but never below 0
        await User.findByIdAndUpdate(req.session.userId, {
            $inc: { unreadCount: -1 }
        });

        // Make sure unreadCount never goes below 0
        await User.updateOne(
            { _id: req.session.userId, unreadCount: { $lt: 0 } },
            { unreadCount: 0 }
        );

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
};

module.exports = { getNotifications, markAllRead, markOneRead };