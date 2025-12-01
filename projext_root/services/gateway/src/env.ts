import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.GATEWAY_PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET ?? "change_me_jwt",
  adminToken: process.env.ADMIN_TOKEN ?? "2278985780",
  adminUsername: process.env.ADMIN_USERNAME ?? "guanliyuanliu",
  adminPassword: process.env.ADMIN_PASSWORD ?? "2278985780",
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER ?? "chatapp",
    password: process.env.MYSQL_PASSWORD ?? "change_me_db",
    database: process.env.MYSQL_DATABASE ?? "chatapp"
  },
  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD ?? "123456"
  },
  accountDb: {
    host: process.env.ACCOUNT_DB_HOST ?? "mysql2.sqlpub.com",
    port: Number(process.env.ACCOUNT_DB_PORT) || 3307,
    user: process.env.ACCOUNT_DB_USER ?? "user_count",
    password: process.env.ACCOUNT_DB_PASSWORD ?? "g6zsVhjVj9vGwnAd",
    database: process.env.ACCOUNT_DB_NAME ?? "user_count_liaotian"
  }
};
