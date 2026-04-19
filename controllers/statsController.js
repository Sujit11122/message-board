const Topic = require('../models/Topic');
const Message = require('../models/Message');

const getStats = async (req, res) => {
    try {
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
            username: req.session.username
        });
    } catch (err) {
        res.render('stats', {
            topicsWithCounts: [],
            username: req.session.username
        });
    }
};

module.exports = { getStats };