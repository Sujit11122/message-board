const Topic = require('../models/Topic');
const Message = require('../models/Message');
const User = require('../models/User'); // ← add this

const getStats = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId); // ← add this

        const topics = await Topic.find()
            .populate('createdBy', 'username')
            .sort({ accessCount: -1 });

        const topicsWithCounts = await Promise.all(
            topics.map(async (topic) => {
                const messageCount = await Message.countDocuments({ topic: topic._id });
                return { topic, messageCount };
            })
        );

        res.render('stats', {
            topicsWithCounts,
            username: req.session.username,
            unreadCount: user.unreadCount 
        });
    } catch (err) {
        res.render('stats', {
            topicsWithCounts: [],
            username: req.session.username,
            unreadCount: 0 
        });
    }
};

module.exports = { getStats };