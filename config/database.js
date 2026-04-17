const mongoose = require('mongoose');

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        Database.instance = this;
    }

    connect() {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => console.log('MongoDB connected'))
            .catch(err => console.log('DB connection error:', err));
    }
}

module.exports = new Database();