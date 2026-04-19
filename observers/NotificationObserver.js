class NotificationObserver {
    update(event, data) {
        switch(event) {
            case 'topic_created':
                console.log(`[Observer] New topic created: "${data.topicTitle}"`);
                break;
            case 'topic_accessed':
                console.log(`[Observer] Topic accessed: "${data.topicTitle}"`);
                break;
            case 'message_posted':
                console.log(`[Observer] New message in topic "${data.topicTitle}": ${data.message}`);
                break;
            default:
                console.log(`[Observer] Event: ${event}`, data);
        }
    }
}

module.exports = new NotificationObserver();