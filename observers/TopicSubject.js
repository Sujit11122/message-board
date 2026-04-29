class TopicSubject {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(event, data) {
        this.observers.forEach(observer => {
            // Handle both sync and async observers ✅
            Promise.resolve(observer.update(event, data))
                .catch(err => console.log(`[Subject] Observer error for event "${event}":`, err));
        });
    }
}

module.exports = new TopicSubject();