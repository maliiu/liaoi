import dotenv from "dotenv";
import path from "path";

// 加载项目根目录的.env文件
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export const env = {
  port: Number(process.env.CHAT_PORT) || 4100,
  mongoUri: process.env.MONGO_URI ?? "mongodb://mongodb:27017/chatapp",
  redis: {
    host: process.env.REDIS_HOST ?? "172.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD ?? "123456"
  }
};
