const Message = require('../models/Message');
const Topic = require('../models/Topic');
const User = require('../models/User');
const topicSubject = require('../observers/TopicSubject');

const postMessage = async (req, res) => {
    const { content } = req.body;
    const topicId = req.params.topicId;

    try {
        const user = await User.findById(req.session.userId);
        const isSubscribed = user.subscribedTopics
            .map(id => id.toString())
            .includes(topicId);

        if (!isSubscribed) return res.redirect(`/topics/${topicId}`);

        const message = new Message({
            content,
            author: req.session.userId,
            topic: topicId
        });
        await message.save();

        const topic = await Topic.findById(topicId);
        topicSubject.notify('message_posted', {
            topicId: topic._id,
            topicTitle: topic.title,
            message: content
        });

        res.redirect(`/topics/${topicId}`);
    } catch (err) {
        res.redirect(`/topics/${topicId}`);
    }
};

module.exports = { postMessage };