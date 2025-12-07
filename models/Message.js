import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },

    text: { type: String, default: "" },
    replyTo: { type: Object, default: null },

    status: { type: String, default: "sent" }, // sent → delivered → seen

    // ⭐ Delete Support
    deletedForEveryone: { type: Boolean, default: false },
    deletedFor: { type: [String], default: [] }, // userIds who deleted only for themselves
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
