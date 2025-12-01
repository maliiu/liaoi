import http from "http";
import pino from "pino";
import { createClient } from "redis";
import { env } from "./env";
import { getMessagesCollection } from "./lib/mongo";

async function bootstrap() {
  const logger = pino();
  const subscriber = createClient({
    url: `redis://:${env.redis.password}@${env.redis.host}:${env.redis.port}`
  });

  subscriber.on("error", (err) =>
    logger.error({ err }, "redis_subscriber_error")
  );
  await subscriber.connect();
  await subscriber.subscribe("chat:message", async (message) => {
    try {
      const payload = JSON.parse(message);
      const collection = await getMessagesCollection();
      await collection.insertOne({
        conversationId: payload.conversationId ?? "general",
        sender: payload.sender ?? "未知用户",
        content: payload.content,
        type: payload.type ?? "text",
        status: payload.status ?? "active",
        metadata: payload.metadata ?? null,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date()
      });
      logger.info(
        { sender: payload.sender, conversation: payload.conversationId },
        "message_recorded"
      );
    } catch (error) {
      logger.error({ error, message }, "message_process_failed");
    }
  });

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  });
  server.listen(Number(process.env.TASKS_PORT) || 4200, "0.0.0.0");
  logger.info("tasks_ready");
}

bootstrap().catch((error) => {
  const logger = pino();
  logger.error({ error }, "tasks_start_failed");
  process.exit(1);
});
