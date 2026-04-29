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
            message: content,
            authorId: req.session.userId
        });

        res.redirect(`/topics/${topicId}`);
    } catch (err) {
        res.redirect(`/topics/${topicId}`);
    }
};
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) return res.redirect('back');

        if (message.author.toString() !== req.session.userId.toString()) {
            return res.redirect('back');
        }

        const topicId = message.topic;
        await Message.findByIdAndDelete(req.params.messageId);

        res.redirect(`/topics/${topicId}`);
    } catch (err) {
        res.redirect('back');
    }
};

const editMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) return res.redirect('back');

        if (message.author.toString() !== req.session.userId.toString()) {
            return res.redirect('back');
        }

        await Message.findByIdAndUpdate(req.params.messageId, {
            content: req.body.content,
            isEdited: true,
            updatedAt: new Date()
        });

        res.redirect(`/topics/${message.topic}`);
    } catch (err) {
        res.redirect('back');
    }
};

module.exports = { postMessage, deleteMessage, editMessage };