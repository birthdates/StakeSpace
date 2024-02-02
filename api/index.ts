import dotenv from "dotenv";

dotenv.config({
  path: "../.env.local",
});

import { createServer } from "http";
import { Server } from "socket.io";
import { getUserId } from "../src/utils/account";
import { getRedisClient, REDIS_PUB } from "../src/utils/redis";
import { callListener } from "./listener";
import { checkGames } from "./listeners/game";
import { checkForCaseOpenExpiry } from "./listeners/case";
import("./bots");

const httpServer = createServer();
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_HOST!,
    methods: ["GET", "POST"],
  },
});

const userIDToSocketID = new Map();

getRedisClient().then(async (redisClient) => {
  const sub = redisClient.duplicate();
  await sub.connect();
  await sub.subscribe(REDIS_PUB, (message: any) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "send_to_socket":
        const { userId, event, data: eventData } = data.data;
        const socketIDs = userIDToSocketID.get(userId);
        if (!socketIDs) return;
        socketIDs.forEach((socketId: string) =>
          io.to(socketId).emit("message", { data: eventData, type: event }),
        );
        break;
    }
  });
});

io.use(async (socket: any, next: any) => {
  const cookie = socket.handshake.headers.cookie;
  let userId;
  if (cookie) {
    const token = cookie.split("=")[1];
    if (token) {
      userId = await getUserId(token);
      // Make it a set
      if (!userIDToSocketID.has(userId)) {
        userIDToSocketID.set(userId, new Set());
      }
      userIDToSocketID.get(userId).add(socket.id);
    }
  }
  socket.userId = userId;
  next();
});

async function checks() {
  await Promise.all([checkForCaseOpenExpiry(), checkGames()]);
}

io.on("connection", function connection(ws: any) {
  ws.on("message", async function incoming(data: any) {
    try {
      const ip = ws.handshake.address ?? ws.request.connection.remoteAddress;
      let result = await callListener(data.type, ws.userId, ip, data);
      if (result === undefined || !data.callbackId) return;
      ws.emit(data.callbackId, result);
    } catch (err) {
      console.error(err);
    }
  });
});

io.on("disconnect", async (socket: any) => {
  if (!socket.userId) return;
  const socketIDs = userIDToSocketID.get(socket.userId);
  if (!socketIDs) return;
  socketIDs.delete(socket.id);
  if (socketIDs.size === 0) {
    userIDToSocketID.delete(socket.userId);
  }
});

setInterval(checks, 1000);
import("./listeners");
httpServer.listen(3005);
