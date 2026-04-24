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
            topicsWithMessages
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.render('dashboard', {
            username: req.session.username,
            topicsWithMessages: [],
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
            error: req.query.error || null
        });
    } catch (err) {
        res.render('topics', {
            topics: [],
            subscribedIds: [],
            userId: '',
            username: req.session.username,
            error: 'Could not load topics.'
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

        topicSubject.notify('topic_created', {
            topicId: topic._id,
            topicTitle: topic.title
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

        topic.accessCount += 1;
        await topic.save();

        topicSubject.notify('topic_accessed', {
            topicId: topic._id,
            topicTitle: topic.title
        });

        const messages = await Message.find({ topic: topic._id })
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        const user = await User.findById(req.session.userId);
        const isSubscribed = user.subscribedTopics
            .map(id => id.toString())
            .includes(topic._id.toString());

        res.render('topicDetail', {
            topic,
            messages,
            isSubscribed,
            username: req.session.username,
            currentUserId: req.session.userId.toString()
        });
    } catch (err) {
        res.redirect('/topics');
    }
};

const subscribeTopic = async (req, res) => {
    try {
        await Topic.findByIdAndUpdate(req.params.id, {
            $addToSet: { subscribers: req.session.userId }
        });
        await User.findByIdAndUpdate(req.session.userId, {
            $addToSet: { subscribedTopics: req.params.id }
        });
        res.redirect('/topics');
    } catch (err) {
        res.redirect('/topics');
    }
};

const unsubscribeTopic = async (req, res) => {
    try {
        await Topic.findByIdAndUpdate(req.params.id, {
            $pull: { subscribers: req.session.userId }
        });
        await User.findByIdAndUpdate(req.session.userId, {
            $pull: { subscribedTopics: req.params.id }
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