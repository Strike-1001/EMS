import Message from "../models/Message.js";
import User from "../models/User.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { recipient, subject, content, messageType, priority } = req.body;

    const message = new Message({
      sender: req.user.id,
      recipient,
      subject,
      content,
      messageType: messageType || 'personal',
      priority: priority || 'medium'
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Send broadcast message (admin only)
export const sendBroadcastMessage = async (req, res) => {
  try {
    const { subject, content, priority } = req.body;

    const message = new Message({
      sender: req.user.id,
      subject,
      content,
      messageType: 'broadcast',
      priority: priority || 'medium'
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: "Broadcast message sent successfully",
      data: message
    });
  } catch (error) {
    console.error("Send Broadcast Message Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get inbox messages
export const getInboxMessages = async (req, res) => {
  try {
    const { messageType, isRead } = req.query;
    let query = { recipient: req.user.id };

    if (messageType) {
      query.messageType = messageType;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Get Inbox Messages Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get sent messages
export const getSentMessages = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user.id })
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Get Sent Messages Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get broadcast messages
export const getBroadcastMessages = async (req, res) => {
  try {
    const messages = await Message.find({ messageType: 'broadcast' })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Get Broadcast Messages Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndUpdate(
      id,
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message
    });
  } catch (error) {
    console.error("Mark Message As Read Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Delete Message Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get message statistics
export const getMessageStats = async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });
    const sentMessages = await Message.countDocuments({ sender: req.user.id });

    res.status(200).json({
      success: true,
      stats: {
        totalMessages,
        unreadMessages,
        sentMessages
      }
    });
  } catch (error) {
    console.error("Get Message Stats Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}; 