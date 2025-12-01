import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "./db";
import { pickAvatarColor } from "../utils/avatar";

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url?: string | null;
}

export async function findUserByUsername(username: string): Promise<UserRow | undefined> {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, username, display_name, avatar_color FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  if (rows[0]) {
    // 确保返回的对象包含avatar_url属性
    return {
      ...rows[0],
      avatar_url: rows[0].avatar_url ?? null
    };
  }
  return undefined;
}

export async function ensureUser(username: string): Promise<UserRow> {
  const existing = await findUserByUsername(username);
  if (existing) {
    await pool.query("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", [
      existing.id
    ]);
    return existing;
  }
  const displayName = username;
  const avatarColor = pickAvatarColor(username);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (username, display_name, avatar_color, status) VALUES (?, ?, ?, 'online')",
    [username, displayName, avatarColor]
  );
  return {
    id: result.insertId,
    username,
    display_name: displayName,
    avatar_color: avatarColor,
    avatar_url: null
  } as UserRow;
}
