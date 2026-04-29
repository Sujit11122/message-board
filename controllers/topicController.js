const Topic = require('../models/Topic');
const Message = require('../models/Message');
const User = require('../models/User');
const topicSubject = require('../observers/TopicSubject');
const notificationObserver = require('../observers/NotificationObserver');

topicSubject.subscribe(notificationObserver);

const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('subscribedTopics');
        const topicsWithMessages = [];

        for (const topic of user.subscribedTopics) {
            const messages = await Message.find({ topic: topic._id })
                .populate('author', 'username')
                .sort({ createdAt: -1 })
                .limit(2);
            topicsWithMessages.push({ topic, messages });
        }

        res.render('dashboard', {
            username: req.session.username,
            topicsWithMessages,
            unreadCount: user.unreadCount
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.render('dashboard', {
            username: req.session.username,
            topicsWithMessages: [],
            unreadCount: 0,
            error: 'Could not load dashboard.'
        });
    }
};

const getAllTopics = async (req, res) => {
    try {
        const allTopics = await Topic.find().populate('createdBy', 'username');
        const user = await User.findById(req.session.userId);
        const subscribedIds = user.subscribedTopics.map(id => id.toString());

        res.render('topics', {
            topics: allTopics,
            subscribedIds,
            userId: req.session.userId.toString(),
            username: req.session.username,
            error: req.query.error || null,
            unreadCount: user.unreadCount
        });
    } catch (err) {
        res.render('topics', {
            topics: [],
            subscribedIds: [],
            userId: '',
            username: req.session.username,
            error: 'Could not load topics.',
            unreadCount: 0
        });
    }
};

const createTopic = async (req, res) => {
    const { title, description } = req.body;
    try {
        const topic = new Topic({
            title,
            description,
            createdBy: req.session.userId,
            subscribers: [req.session.userId]
        });
        await topic.save();

        await User.findByIdAndUpdate(req.session.userId, {
            $addToSet: { subscribedTopics: topic._id }
        });

        // Pass userId so observer can notify the creator
        topicSubject.notify('topic_created', {
            topicId: topic._id,
            topicTitle: topic.title,
            userId: req.session.userId
        });

        res.redirect('/dashboard');
    } catch (err) {
        res.redirect('/topics?error=Topic+creation+failed');
    }
};

const getTopicDetail = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id).populate('createdBy', 'username');
        if (!topic) return res.redirect('/topics');

        // accessCount increment removed — observer handles it now
        topicSubject.notify('topic_accessed', {
            topicId: topic._id,
            topicTitle: topic.title
        });

        const messages = await Message.find({ topic: topic._id })
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        const user = await User.findById(req.session.userId);

        // Reset unread count when user opens a topic
        await User.findByIdAndUpdate(req.session.userId, { unreadCount: 0 });

        const isSubscribed = user.subscribedTopics
            .map(id => id.toString())
            .includes(topic._id.toString());

        res.render('topicDetail', {
            topic,
            messages,
            isSubscribed,
            username: req.session.username,
            currentUserId: req.session.userId.toString(),
            unreadCount: 0
        });
    } catch (err) {
        res.redirect('/topics');
    }
};

const subscribeTopic = async (req, res) => {
    try {
        // returnDocument: 'after' replaces deprecated { new: true }
        const topic = await Topic.findByIdAndUpdate(req.params.id, {
            $addToSet: { subscribers: req.session.userId }
        }, { returnDocument: 'after' }); // ← fixed

        await User.findByIdAndUpdate(req.session.userId, {
            $addToSet: { subscribedTopics: req.params.id }
        });

        // Fire subscribe event — observer handles notification
        topicSubject.notify('topic_subscribed', {
            userId: req.session.userId,
            username: req.session.username,
            topicId: topic._id,
            topicTitle: topic.title
        });

        res.redirect('/topics');
    } catch (err) {
        res.redirect('/topics');
    }
};

const unsubscribeTopic = async (req, res) => {
    try {
        // returnDocument: 'after' replaces deprecated { new: true }
        const topic = await Topic.findByIdAndUpdate(req.params.id, {
            $pull: { subscribers: req.session.userId }
        }, { returnDocument: 'after' }); // ← fixed

        await User.findByIdAndUpdate(req.session.userId, {
            $pull: { subscribedTopics: req.params.id }
        });

        // Fire unsubscribe event — observer handles notification
        topicSubject.notify('topic_unsubscribed', {
            userId: req.session.userId,
            username: req.session.username,
            topicId: topic._id,
            topicTitle: topic.title
        });

        const referer = req.headers.referer || '/dashboard';
        res.redirect(referer);
    } catch (err) {
        res.redirect('/dashboard');
    }
};

module.exports = {
    getDashboard,
    getAllTopics,
    createTopic,
    getTopicDetail,
    subscribeTopic,
    unsubscribeTopic
};