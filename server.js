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

// ⭐ CORS FIXED FOR RENDER + VERCEL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-frontend-three-blue.vercel.app",
      process.env.CLIENT_URL,
    ],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// DB
connectDB(process.env.MONGO_URI);

const server = http.createServer(app);

// SOCKET
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-frontend-three-blue.vercel.app",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  socket.on("userConnected", (userId) => {
    socket.data.userId = userId;
  });

  // JOIN ROOM
  socket.on("joinRoom", ({ userId1, userId2 }) => {
    const room = [userId1, userId2].sort().join("_");
    socket.join(room);
  });

  // SEND MESSAGE
  socket.on("privateMessage", async (data) => {
    try {
      const { sender, receiver, text } = data;

      if (!sender || !receiver) {
        console.log("❌ Missing IDs");
        return;
      }

      const room = [sender, receiver].sort().join("_");

      const msg = await Message.create({
        conversationId: room,
        sender,
        receiver,
        text,
        status: "delivered",
      });

      io.to(room).emit("newMessage", msg);
    } catch (err) {
      console.log("❌ Message Error:", err);
    }
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
