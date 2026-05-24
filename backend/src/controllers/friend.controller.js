const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const getFriends = async (req, res) => {
  try {
    const accepted = await FriendRequest.find({
      $or: [{ sender_id: req.userId }, { receiver_id: req.userId }],
      status: 'accepted',
    }).populate('sender_id receiver_id', 'display_name username avatar is_online');
    
    const friends = accepted.map(f => {
      const friend = f.sender_id._id.toString() === req.userId.toString() ? f.receiver_id : f.sender_id;
      return friend;
    });
    
    res.json({ friends });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

const addFriend = async (req, res) => {
  try {
    const { phone, username } = req.body;
    let query = {};
    if (phone) query.phone = phone;
    else if (username) query.username = username;
    else return res.status(400).json({ error: 'Phone or username required' });
    
    const friendUser = await User.findOne(query);
    if (!friendUser) return res.status(404).json({ error: 'User not found' });
    if (friendUser._id.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }
    
    const existing = await FriendRequest.findOne({
      $or: [
        { sender_id: req.userId, receiver_id: friendUser._id },
        { sender_id: friendUser._id, receiver_id: req.userId },
      ],
    });
    
    if (existing) return res.status(400).json({ error: 'Request already sent' });
    
    const request = await FriendRequest.create({
      sender_id: req.userId,
      receiver_id: friendUser._id,
    });
    
    res.status(201).json({ message: 'Friend request sent', request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { request_id, action } = req.body; // action: accept/decline
    const request = await FriendRequest.findById(request_id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiver_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    request.status = action === 'accept' ? 'accepted' : 'declined';
    request.responded_at = new Date();
    await request.save();
    
    res.json({ message: `Friend request ${action}ed` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond' });
  }
};

const removeFriend = async (req, res) => {
  try {
    await FriendRequest.findOneAndDelete({
      $or: [
        { sender_id: req.userId, receiver_id: req.params.id },
        { sender_id: req.params.id, receiver_id: req.userId },
      ],
      status: 'accepted',
    });
    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver_id: req.userId,
      status: 'pending',
    }).populate('sender_id', 'display_name username avatar');
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

module.exports = { getFriends, addFriend, respondToRequest, removeFriend, getPendingRequests };
