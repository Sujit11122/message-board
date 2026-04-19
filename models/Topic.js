const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    accessCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', topicSchema);