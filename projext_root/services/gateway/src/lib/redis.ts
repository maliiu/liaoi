import { createClient } from "redis";
import { env } from "../env";

export const redisClient = createClient({
  url: `redis://:${env.redis.password}@${env.redis.host}:${env.redis.port}`
});

redisClient.on("error", (error) => {
  console.error("Redis error", error);
});

