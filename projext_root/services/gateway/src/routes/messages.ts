import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../lib/db";
import { redisClient } from "../lib/redis";
import { authenticate } from "../middleware/auth";
import {
  addMemberIfMissing,
  getOrCreateConversationId
} from "../lib/conversations";
import {
  MessageValidationError,
  validateAndSanitizeMessage
} from "../utils/contentFilter";
import { findUserByUsername, ensureUser } from "../lib/users";
import { logger } from "../logger";
import { getSensitiveWords } from "../lib/sensitiveWords";

const DEFAULT_CONVERSATION = "general";

function normalizeConversationSlug(value?: string) {
  if (!value) return DEFAULT_CONVERSATION;
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9-_]{3,64}$/.test(slug)) {
    return DEFAULT_CONVERSATION;
  }
  return slug;
}

const postMessageLimiter = rateLimit({
  windowMs: 15 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user?.sub;
    return user || req.ip;
  },
  message: { message: "rate_limited" }
});

interface MessageRow extends RowDataPacket {
  id: number;
  sender: string;
  content: string;
  message_type: string;
  status: string;
  metadata: any;
  created_at: Date;
  conversation_slug: string | null;
}

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const conversationSlug = normalizeConversationSlug(
      typeof req.query.conversationId === "string"
        ? req.query.conversationId
        : undefined
    );
    const [rows] = await pool.query<MessageRow[]>(
      `SELECT m.id,
              m.content,
              m.message_type,
              m.status,
              m.metadata,
              m.created_at,
              u.username AS sender,
              COALESCE(c.slug, ?) AS conversation_slug
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         LEFT JOIN conversations c ON c.id = m.conversation_id
        WHERE COALESCE(c.slug, ?) = ?
        ORDER BY m.id ASC
        LIMIT ? OFFSET ?`,
      [
        DEFAULT_CONVERSATION,
        DEFAULT_CONVERSATION,
        conversationSlug,
        limit,
        offset
      ]
    );
    const messages = rows.map((row) => {
      let parsedMetadata: unknown = null;
      if (row.metadata) {
        if (typeof row.metadata === "string") {
          parsedMetadata = JSON.parse(row.metadata);
        } else if (Buffer.isBuffer(row.metadata)) {
          parsedMetadata = JSON.parse(row.metadata.toString("utf8"));
        } else {
          parsedMetadata = row.metadata;
        }
      }
      return {
        id: row.id,
        sender: row.sender,
        content: row.content,
        type: row.message_type,
        status: row.status,
        metadata: parsedMetadata,
        createdAt: row.created_at,
        conversationId: row.conversation_slug ?? DEFAULT_CONVERSATION
      };
    });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, postMessageLimiter, async (req, res, next) => {
  try {
    if (!req.is("application/json")) {
      return res.status(415).json({ message: "unsupported_media_type" });
    }
    const { content, conversationId, type = "text", metadata = null } =
      req.body || {};
    const conversationSlug = normalizeConversationSlug(conversationId);

    let sanitized: string;
    let hadSensitiveWord = false;
    try {
      const bannedWords = await getSensitiveWords();
      const result = validateAndSanitizeMessage(
        String(content ?? ""),
        bannedWords
      );
      sanitized = result.sanitized;
      hadSensitiveWord = result.hadSensitiveWord;
    } catch (error) {
      if (error instanceof MessageValidationError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }

    const username = (req as any).user?.sub;
    if (!username) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));

    const conversationIdNumeric = await getOrCreateConversationId(
      conversationSlug,
      conversationSlug === DEFAULT_CONVERSATION ? "公共聊天室" : conversationSlug
    );
    await addMemberIfMissing(conversationIdNumeric, user.id);

    const normalizedType =
      ["text", "image", "file", "system", "voice"].includes(type) ? type : "text";

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO messages (conversation_id, sender_id, sender, content, message_type, metadata) VALUES (?, ?, ?, ?, ?, ?)",
      [
        conversationIdNumeric,
        user.id,
        username,
        sanitized,
        normalizedType,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    const message = {
      id: result.insertId,
      sender: username,
      content: sanitized,
      type: normalizedType,
      status: "active",
      metadata,
      createdAt: new Date().toISOString(),
      conversationId: conversationSlug
    };

    await redisClient.publish("chat:message", JSON.stringify(message));
    logger.info(
      {
        username,
        conversation: conversationSlug,
        flagged: hadSensitiveWord
      },
      "message_created"
    );
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/recall", authenticate, async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    if (!Number.isInteger(messageId)) {
      return res.status(400).json({ message: "invalid_id" });
    }
    const username = (req as any).user?.sub;
    if (!username) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT sender_id, conversation_id FROM messages WHERE id = ? LIMIT 1",
      [messageId]
    );
    if (!rows.length || rows[0].sender_id !== user.id) {
      return res.status(403).json({ message: "forbidden" });
    }
    await pool.query(
      "UPDATE messages SET status = 'recalled', message_type = 'recall', content = '', metadata = NULL WHERE id = ?",
      [messageId]
    );
    const [conversationRow] = await pool.query<RowDataPacket[]>(
      "SELECT slug FROM conversations WHERE id = ? LIMIT 1",
      [rows[0].conversation_id]
    );
    const conversationSlug =
      conversationRow[0]?.slug ?? DEFAULT_CONVERSATION;
    const payload = {
      id: messageId,
      status: "recalled",
      type: "recall",
      conversationId: conversationSlug
    };
    await redisClient.publish("chat:message", JSON.stringify(payload));
    res.json({ message: payload });
  } catch (error) {
    next(error);
  }
});

export default router;
