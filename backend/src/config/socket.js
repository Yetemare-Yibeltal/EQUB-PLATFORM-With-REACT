import { Server } from "socket.io";
import config from "./env.js";

let io = null;

export const userRoom = (userId) => `user:${userId}`;

export const groupRoom = (groupId) => `group:${groupId}`;

export const createSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 10000,
    maxHttpBufferSize: 100000,
  });

  return io;
};

export const getIO = () => io;

export const closeSocketServer = () =>
  new Promise((resolve) => {
    if (!io) {
      resolve();
      return;
    }

    const instance = io;
    io = null;
    instance.close(() => resolve());
  });

export const emitToUser = (userId, event, payload) => {
  io?.to(userRoom(userId)).emit(event, payload);
};

export const emitToGroup = (groupId, event, payload) => {
  io?.to(groupRoom(groupId)).emit(event, payload);
};

export const evictUserFromGroup = (userId, groupId) => {
  io?.in(userRoom(userId)).socketsLeave(groupRoom(groupId));
};
