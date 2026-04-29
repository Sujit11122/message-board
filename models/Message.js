const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
