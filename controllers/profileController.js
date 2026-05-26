const User = require('../models/User');
const Message = require('../models/Message');
const Topic = require('../models/Topic');

// View user profile
const getProfile = async (req, res) => {
    try {
        const profileUser = await User.findOne({ username: req.params.username })
            .populate('followers', 'username')
            .populate('following', 'username');

        if (!profileUser) return res.redirect('/dashboard');

        // Get user's messages
        const messages = await Message.find({ author: profileUser._id })
            .populate('topic', 'title')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get user's created topics
        const topics = await Topic.find({ createdBy: profileUser._id })
            .sort({ createdAt: -1 });

        // Get logged in user to check if following
        const loggedInUser = await User.findById(req.session.userId);
        const isFollowing = loggedInUser.following
            .map(id => id.toString())
            .includes(profileUser._id.toString());

        const isOwnProfile = req.session.userId.toString() === profileUser._id.toString();

        res.render('profile', {
            profileUser,
            messages,
            topics,
            isFollowing,
            isOwnProfile,
            username: req.session.username,
            unreadCount: loggedInUser.unreadCount
        });

    } catch (err) {
        console.log('Profile error:', err);
        res.redirect('/dashboard');
    }
};

// Follow a user
const followUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.json({ success: false });

        const currentUserId = req.session.userId;

        // Can't follow yourself
        if (targetUser._id.toString() === currentUserId.toString()) {
            return res.json({ success: false, error: "Can't follow yourself" });
        }

        const isFollowing = targetUser.followers
            .map(id => id.toString())
            .includes(currentUserId.toString());

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(req.params.userId, {
                $pull: { followers: currentUserId }
            });
            await User.findByIdAndUpdate(currentUserId, {
                $pull: { following: req.params.userId }
            });
            return res.json({ success: true, action: 'unfollowed' });
        }

        // Follow
        await User.findByIdAndUpdate(req.params.userId, {
            $addToSet: { followers: currentUserId }
        });
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { following: req.params.userId }
        });

        return res.json({ success: true, action: 'followed' });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// Update profile bio
const updateProfile = async (req, res) => {
    try {
        const { bio } = req.body;
        await User.findByIdAndUpdate(req.session.userId, { bio });
        res.redirect(`/profile/${req.session.username}`);
    } catch (err) {
        res.redirect('/dashboard');
    }
};

module.exports = { getProfile, followUser, updateProfile };