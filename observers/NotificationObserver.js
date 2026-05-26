const User = require('../models/User');
const Topic = require('../models/Topic');
const Notification = require('../models/Notification');

class NotificationObserver {
    async update(event, data) {
        switch(event) {

            case 'topic_created':
                console.log(`[Observer] New topic created: "${data.topicTitle}"`);
                try {
                    // Notify the creator
                    await Notification.create({
                        user: data.userId,
                        message: `You created a new topic "${data.topicTitle}". You are automatically subscribed!`,
                        topic: data.topicId,
                        isRead: false
                    });
                    await User.findByIdAndUpdate(data.userId, { $inc: { unreadCount: 1 } });
                } catch(err) {
                    console.log('[Observer] topic_created error:', err);
                }
                break;

            case 'topic_accessed':
                console.log(`[Observer] Topic accessed: "${data.topicTitle}"`);
                try {
                    // Increment access count — moved from controller to observer 
                    await Topic.findByIdAndUpdate(data.topicId, {
                        $inc: { accessCount: 1 }
                    });
                } catch(err) {
                    console.log('[Observer] topic_accessed error:', err);
                }
                break;

            case 'topic_subscribed':
                console.log(`[Observer] User "${data.username}" subscribed to "${data.topicTitle}"`);
                try {
                    // Notify the subscriber
                    await Notification.create({
                        user: data.userId,
                        message: `You subscribed to "${data.topicTitle}"! You will now receive updates from this topic.`,
                        topic: data.topicId,
                        isRead: false
                    });
                    await User.findByIdAndUpdate(data.userId, { $inc: { unreadCount: 1 } });
                } catch(err) {
                    console.log('[Observer] topic_subscribed error:', err);
                }
                break;

            case 'topic_unsubscribed':
                console.log(`[Observer] User "${data.username}" unsubscribed from "${data.topicTitle}"`);
                try {
                    // Notify the user
                    await Notification.create({
                        user: data.userId,
                        message: `You unsubscribed from "${data.topicTitle}".`,
                        topic: data.topicId,
                        isRead: false
                    });
                    await User.findByIdAndUpdate(data.userId, { $inc: { unreadCount: 1 } });
                } catch(err) {
                    console.log('[Observer] topic_unsubscribed error:', err);
                }
                break;

            case 'message_posted':
                console.log(`[Observer] New message in topic "${data.topicTitle}": ${data.message}`);
                try {
                    const topic = await Topic.findById(data.topicId);
                    if (topic && topic.subscribers.length > 0) {

                        // Create notification for each subscriber except the author
                        const notifications = topic.subscribers
                            .filter(sub => sub.toString() !== data.authorId.toString())
                            .map(subscriberId => ({
                                user: subscriberId,
                                message: `New message in "${data.topicTitle}": "${data.message.substring(0, 60)}..."`,
                                topic: data.topicId,
                                isRead: false
                            }));

                        if (notifications.length > 0) {
                            await Notification.insertMany(notifications);

                            // Update unread count for all subscribers except author
                            await User.updateMany(
                                {
                                    $and: [
                                        { _id: { $in: topic.subscribers } },
                                        { _id: { $ne: data.authorId } }
                                    ]
                                },
                                { $inc: { unreadCount: 1 } }
                            );

                            console.log(`[Observer] Notifications sent to ${notifications.length} subscribers`);
                        }
                    }
                } catch(err) {
                    console.log('[Observer] message_posted error:', err);
                }
                break;

            default:
                console.log(`[Observer] Event: ${event}`, data);
        }
    }
}

module.exports = new NotificationObserver();