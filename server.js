import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";

import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/users.js";
import Message from "./models/Message.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

// ✅ FIXED CORS (no wildcard *)
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ❌ REMOVE THIS — It breaks Render deploy
// app.options("*", cors());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// DB CONNECT
connectDB(process.env.MONGO_URI);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User Connected:", socket.id);

  socket.on("userConnected", (userId) => {
    socket.data.userId = userId;
  });

  socket.on("joinRoom", ({ userId1, userId2 }) => {
    const room = [userId1, userId2].sort().join("_");
    socket.join(room);
  });

  socket.on("privateMessage", async ({ sender, receiver, text, replyTo }) => {
    try {
      const room = [sender, receiver].sort().join("_");

      const msg = await Message.create({
        conversationId: room,
        sender,
        receiver,
        text,
        replyTo,
        status: "delivered",
      });

      io.to(room).emit("messageDelivered", {
        messageId: msg._id,
        status: "delivered",
      });

      io.to(room).emit("newMessage", msg);
    } catch (err) {
      console.log("❌ Message Save Error:", err);
    }
  });

  socket.on("markAsSeen", async ({ sender, receiver }) => {
    try {
      const room = [sender, receiver].sort().join("_");

      await Message.updateMany(
        {
          conversationId: room,
          receiver: sender,
          status: { $ne: "seen" },
        },
        { status: "seen" }
      );

      io.to(room).emit("messageSeen", { sender, receiver });
    } catch (err) {
      console.log("❌ Seen update error:", err);
    }
  });

  socket.on("deleteMessage", async ({ messageId, userId, forEveryone }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const room = msg.conversationId;

      // DELETE FOR EVERYONE
      if (forEveryone) {
        msg.text = "";
        msg.deletedForEveryone = true;
        await msg.save();

        io.to(room).emit("messageDeleted", {
          messageId,
          forEveryone: true,
        });
        return;
      }

      // DELETE FOR ME ONLY
      if (!msg.deletedFor.includes(userId)) msg.deletedFor.push(userId);
      await msg.save();

      io.to(room).emit("messageDeleted", {
        messageId,
        forEveryone: false,
        userId,
      });
    } catch (err) {
      console.log("❌ Delete Message Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
