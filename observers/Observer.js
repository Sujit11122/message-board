class Observer {
    update(event, data) {
        throw new Error('update() must be implemented')
    }
}

module.exports = Observer