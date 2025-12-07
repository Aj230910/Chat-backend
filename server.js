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

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        ALLOWED_ORIGINS.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        console.log("❌ BLOCKED ORIGIN:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

connectDB(process.env.MONGO_URI);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        ALLOWED_ORIGINS.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        console.log("❌ BLOCKED SOCKET ORIGIN:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"]
  }
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

  socket.on("privateMessage", async ({ sender, receiver, text }) => {
    try {
      if (!sender || !receiver || !text?.trim()) return;

      const room = [sender, receiver].sort().join("_");

      const msg = await Message.create({
        conversationId: room,
        sender,
        receiver,
        text,
        status: "delivered"
      });

      io.to(room).emit("newMessage", msg);

    } catch (err) {
      console.log("❌ Message Save Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on PORT ${PORT}`);
});
