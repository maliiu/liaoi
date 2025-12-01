import dotenv from "dotenv";

dotenv.config();

export const env = {
  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD ?? "123456"
  },
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/chatapp"
};

