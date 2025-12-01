import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "./db";

interface ConversationRow extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  type: string;
}

interface ConversationListRow extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  type: string;
  last_message_at: Date | null;
}

export async function ensureConversationBySlug(
  slug: string,
  title: string,
  type: "public" | "direct" | "group" | "room" = "public",
  isPrivate = 0,
  passwordHash: string | null = null,
  createdBy?: number | null
) {
  const [rows] = await pool.query<ConversationRow[]>(
    "SELECT id, slug FROM conversations WHERE slug = ? LIMIT 1",
    [slug]
  );
  if (rows.length) {
    return rows[0];
  }
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO conversations (slug, title, type, is_private, password_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    [slug, title, type, isPrivate, passwordHash, createdBy ?? null]
  );
  return { id: result.insertId, slug, title, type };
}

export async function addMemberIfMissing(
  conversationId: number,
  userId: number
) {
  await pool.query(
    "INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE joined_at = joined_at",
    [conversationId, userId]
  );
}

export async function getConversationBySlug(slug: string) {
  const [rows] = await pool.query<ConversationRow[]>(
    "SELECT id, slug, title, type FROM conversations WHERE slug = ? LIMIT 1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function getOrCreateConversationId(
  slug: string,
  title?: string,
  type: "public" | "direct" | "group" | "room" = "public",
  isPrivate = 0,
  passwordHash: string | null = null,
  createdBy?: number | null
) {
  const existing = await getConversationBySlug(slug);
  if (existing) return existing.id;
  const created = await ensureConversationBySlug(
    slug,
    title ?? slug,
    type,
    isPrivate,
    passwordHash,
    createdBy
  );
  return created.id;
}

export async function listUserConversations(userId: number) {
  const [rows] = await pool.query<ConversationListRow[]>(
    `SELECT c.id,
            c.slug,
            c.title,
            c.type,
            MAX(m.created_at) AS last_message_at
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id
  LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE cm.user_id = ?
      GROUP BY c.id, c.slug, c.title, c.type
      ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );
  return rows;
}

export async function ensureDirectConversation(
  usernameA: string,
  usernameB: string
) {
  const sorted = [usernameA, usernameB].sort();
  const slug = `direct:${sorted.join("-")}`;
  const title = `${sorted[0]} & ${sorted[1]}`;
  return ensureConversationBySlug(slug, title, "direct");
}

export async function createRoom(
  title: string,
  creatorId: number,
  passwordHash: string | null
) {
  const slug = `room:${Date.now()}:${Math.random().toString(16).slice(2, 8)}`;
  return ensureConversationBySlug(slug, title, "room", passwordHash ? 1 : 0, passwordHash, creatorId);
}

export async function joinRoom(conversationId: number, userId: number) {
  await addMemberIfMissing(conversationId, userId);
}
