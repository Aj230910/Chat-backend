import Message from "../models/Message.js";

export const sendMessageREST = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    const room = [sender, receiver].sort().join("_");

    const msg = await Message.create({
      conversationId: room,
      sender,
      receiver,
      text,
    });

    res.json(msg);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const room = [userId1, userId2].sort().join("_");
    const msgs = await Message.find({ conversationId: room }).sort({ createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteMessageForAll = async (req, res) => {
  try {
    const { messageId } = req.params;

    const msg = await Message.findByIdAndUpdate(
      messageId,
      {
        text: "This message was deleted",
        deletedForAll: true,
      },
      { new: true }
    );

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
