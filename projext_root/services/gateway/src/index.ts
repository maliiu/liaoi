import { createApp } from "./app";
import { env } from "./env";
import { pool } from "./lib/db";
import pino from "pino";
import { redisClient } from "./lib/redis";
import { addMemberIfMissing, ensureConversationBySlug } from "./lib/conversations";
import { accountPool } from "./lib/accountDb";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { ensureUser } from "./lib/users";
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  // Ensure upload directory exists for media access
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  await redisClient.connect();
  await accountPool.query(`CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(16) NOT NULL,
    avatar_url VARCHAR(300) NULL,
    status ENUM('online','offline','busy') DEFAULT 'offline',
    banned_until TIMESTAMP NULL,
    last_seen TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS friendships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT UNSIGNED NOT NULL,
    addressee_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending','accepted','blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_friendship (requester_id, addressee_id),
    CONSTRAINT fk_friend_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend_addressee FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS friend_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT UNSIGNED NOT NULL,
    addressee_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending','accepted','blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_request (requester_id, addressee_id),
    CONSTRAINT fk_req_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_req_addressee FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    type ENUM('public','direct','group','room') NOT NULL DEFAULT 'public',
    is_private TINYINT(1) DEFAULT 0,
    password_hash VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('member','admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    CONSTRAINT fk_member_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    sender VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('text','image','file','system','recall','voice') DEFAULT 'text',
    status ENUM('active','recalled') DEFAULT 'active',
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation (conversation_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // 移除不支持的ALTER TABLE语句
  // 这些列已经在CREATE TABLE语句中定义
  await pool.query(
    `CREATE TABLE IF NOT EXISTS admin_warnings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_admin_warning_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS admin_audits (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(50) NOT NULL,
      target VARCHAR(120) NULL,
      admin_token_prefix VARCHAR(16) NULL,
      meta JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS square_posts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_square_created (created_at),
      CONSTRAINT fk_square_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS drift_bottles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id BIGINT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      bottle_type ENUM('text','voice') DEFAULT 'text',
      metadata JSON NULL,
      picked_by BIGINT UNSIGNED NULL,
      picked_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_drift_pick (picked_by, picked_at),
      CONSTRAINT fk_drift_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_drift_picker FOREIGN KEY (picked_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );

  const generalConversation = await ensureConversationBySlug("general", "公共聊天区");
  await pool.query(
    "UPDATE messages SET conversation_id = ? WHERE conversation_id IS NULL OR conversation_id = 0",
    [generalConversation.id]
  );

  // Ensure preset admin account exists and joins general conversation
  if (env.adminUsername && env.adminPassword) {
    const adminUsername = env.adminUsername.toLowerCase();
    const [accRows] = await accountPool.query<any[]>(
      "SELECT id FROM accounts WHERE username=? LIMIT 1",
      [adminUsername]
    );
    if (!accRows.length) {
      const hash = await bcrypt.hash(env.adminPassword, 10);
      await accountPool.query(
        "INSERT INTO accounts (username, password_hash) VALUES (?, ?)",
        [adminUsername, hash]
      );
    }
    const adminUser = await ensureUser(adminUsername);
    await addMemberIfMissing(generalConversation.id, adminUser.id);
  }

  const app = createApp();
  const logger = pino();
  app.listen(env.port, () => {
    logger.info({ port: env.port }, "gateway_started");
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start gateway", error);
  process.exit(1);
});
