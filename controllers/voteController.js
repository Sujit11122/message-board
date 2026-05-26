const Message = require('../models/Message');
const User = require('../models/User');

// Upvote a message
const upvoteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.json({ success: false, error: 'Message not found' });

        const userId = req.session.userId;

        // Can't vote on own message
        if (message.author.toString() === userId.toString()) {
            return res.json({ success: false, error: "Can't vote on your own message" });
        }

        const alreadyUpvoted = message.upvotes.includes(userId);
        const alreadyDownvoted = message.downvotes.includes(userId);

        if (alreadyUpvoted) {
            // Remove upvote — toggle off
            await Message.findByIdAndUpdate(req.params.messageId, {
                $pull: { upvotes: userId }
            });
            // Remove reputation point
            await User.findByIdAndUpdate(message.author, {
                $inc: { reputation: -1 }
            });
            return res.json({ success: true, action: 'removed', type: 'upvote' });
        }

        if (alreadyDownvoted) {
            // Switch from downvote to upvote
            await Message.findByIdAndUpdate(req.params.messageId, {
                $pull: { downvotes: userId },
                $addToSet: { upvotes: userId }
            });
            // Add 2 reputation (remove -1 downvote + add +1 upvote)
            await User.findByIdAndUpdate(message.author, {
                $inc: { reputation: 2 }
            });
            return res.json({ success: true, action: 'switched', type: 'upvote' });
        }

        // New upvote
        await Message.findByIdAndUpdate(req.params.messageId, {
            $addToSet: { upvotes: userId }
        });
        // Add reputation point to author
        await User.findByIdAndUpdate(message.author, {
            $inc: { reputation: 1 }
        });

        // Check and award badges
        await checkBadges(message.author);

        return res.json({ success: true, action: 'added', type: 'upvote' });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// Downvote a message
const downvoteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.json({ success: false, error: 'Message not found' });

        const userId = req.session.userId;

        // Can't vote on own message
        if (message.author.toString() === userId.toString()) {
            return res.json({ success: false, error: "Can't vote on your own message" });
        }

        const alreadyUpvoted = message.upvotes.includes(userId);
        const alreadyDownvoted = message.downvotes.includes(userId);

        if (alreadyDownvoted) {
            // Remove downvote — toggle off
            await Message.findByIdAndUpdate(req.params.messageId, {
                $pull: { downvotes: userId }
            });
            await User.findByIdAndUpdate(message.author, {
                $inc: { reputation: 1 }
            });
            return res.json({ success: true, action: 'removed', type: 'downvote' });
        }

        if (alreadyUpvoted) {
            // Switch from upvote to downvote
            await Message.findByIdAndUpdate(req.params.messageId, {
                $pull: { upvotes: userId },
                $addToSet: { downvotes: userId }
            });
            await User.findByIdAndUpdate(message.author, {
                $inc: { reputation: -2 }
            });
            return res.json({ success: true, action: 'switched', type: 'downvote' });
        }

        // New downvote
        await Message.findByIdAndUpdate(req.params.messageId, {
            $addToSet: { downvotes: userId }
        });
        await User.findByIdAndUpdate(message.author, {
            $inc: { reputation: -1 }
        });

        return res.json({ success: true, action: 'added', type: 'downvote' });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// Check and award badges
const checkBadges = async (userId) => {
    try {
        const user = await User.findById(userId);
        const badges = user.badges || [];

        // First Post badge
        const messageCount = await Message.countDocuments({ author: userId });
        if (messageCount >= 1 && !badges.includes('First Post')) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: 'First Post' }
            });
        }

        // Popular badge — 10+ reputation
        if (user.reputation >= 10 && !badges.includes('Popular')) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: 'Popular' }
            });
        }

        // Rising Star badge — 50+ reputation
        if (user.reputation >= 50 && !badges.includes('Rising Star')) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: 'Rising Star' }
            });
        }

        // Legend badge — 100+ reputation
        if (user.reputation >= 100 && !badges.includes('Legend')) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: 'Legend' }
            });
        }

    } catch (err) {
        console.log('Badge check error:', err);
    }
};

module.exports = { upvoteMessage, downvoteMessage };