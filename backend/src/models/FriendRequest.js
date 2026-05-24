const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
  message: String,
  responded_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

friendRequestSchema.index({ sender_id: 1, receiver_id: 1 }, { unique: true });
friendRequestSchema.index({ receiver_id: 1, status: 1 });
friendRequestSchema.index({ sender_id: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
