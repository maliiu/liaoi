import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { env } from "./env";
import { redisClient } from "./lib/redis";
import pino from "pino";
import jwt from "jsonwebtoken";
import { createClient } from "redis";

async function bootstrap() {
  await redisClient.connect();
  const redisSub = redisClient.duplicate();
  await redisSub.connect();
  const fastify = Fastify({ logger: true });
  await fastify.register(cors, {
    origin:
      (process.env.PUBLIC_ORIGIN && process.env.PUBLIC_ORIGIN.split(",")) ||
      ["http://localhost"]
  });
  fastify.get("/health", async () => ({ status: "ok" }));
  fastify.get("/api/health", async () => ({ status: "ok" }));
  fastify.setErrorHandler((error, _req, reply) => {
    fastify.log.error({ error }, "unhandled_error");
    reply.status(500).send({ message: "internal_error" });
  });

  const io = new Server(fastify.server, {
    cors: {
      origin:
        (process.env.PUBLIC_ORIGIN && process.env.PUBLIC_ORIGIN.split(",")) ||
        ["http://localhost"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("unauthorized"));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? "change_me_jwt") as any;
      socket.data.username = payload?.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  await redisSub.subscribe("chat:message", (message) => {
    try {
      const payload = JSON.parse(message);
      io.emit("chat:message", payload);
    } catch {
      io.emit("chat:message", {
        sender: "系统",
        content: message,
        createdAt: new Date().toISOString()
      });
    }
  });

  await redisSub.subscribe("chat:control", (message) => {
    try {
      const payload = JSON.parse(message);
      if (payload.type === "ban" && payload.username) {
        io.sockets.sockets.forEach((s) => {
          if (s.data?.username === payload.username) {
            s.emit("chat:ban", { reason: "banned" });
            s.disconnect(true);
          }
        });
      }
    } catch (error) {
      fastify.log.error({ error, message }, "control_message_error");
    }
  });

  const logger = pino();
  await fastify.listen({ host: "0.0.0.0", port: env.port });
  logger.info({ port: env.port }, "chat_started");
}

bootstrap().catch((error) => {
  const logger = pino();
  logger.error({ error }, "chat_start_failed");
  process.exit(1);
});
