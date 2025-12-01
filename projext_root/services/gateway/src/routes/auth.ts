import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { ensureUser } from "../lib/users";
import {
  addMemberIfMissing,
  getOrCreateConversationId
} from "../lib/conversations";
import { registerAccount, verifyAccount } from "../lib/accounts";
import { pool } from "../lib/db";

const router = Router();

function normalizeUsername(username?: string) {
  if (typeof username !== "string") return "";
  return username.trim().toLowerCase();
}

// 允许字母、数字、下划线、点、短横线，长度 3-32
function isValidUsername(username: string) {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

router.post("/register", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: "invalid_username" });
  }
  if (password.length < 6 || password.length > 100) {
    return res.status(400).json({ message: "password_invalid" });
  }
  try {
    await registerAccount(username, password);
    const user = await ensureUser(username);
    const generalConversationId = await getOrCreateConversationId(
      "general",
      "公共聊天区"
    );
    await addMemberIfMissing(generalConversationId, user.id);
    return res.status(201).json({ message: "registered" });
  } catch (error) {
    if (error instanceof Error && error.message === "account_exists") {
      return res.status(409).json({ message: "account_exists" });
    }
    return res.status(500).json({ message: "internal_error" });
  }
});

router.post("/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) {
    return res.status(400).json({ message: "username_password_required" });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: "invalid_username" });
  }
  let isValid = false;
  try {
    isValid = await verifyAccount(username, password);
  } catch (err) {
    return res.status(500).json({ message: "db_error", detail: "account_db_unreachable" });
  }
  if (!isValid) {
    return res.status(401).json({ message: "invalid_credentials" });
  }
  const [userRows] = await pool.query<any[]>(
    "SELECT banned_until FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const bannedUntil = userRows[0]?.banned_until as Date | null;
  if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) {
    return res.status(403).json({
      message: "banned",
      until: bannedUntil
    });
  }
  const user = await ensureUser(username);
  const generalConversationId = await getOrCreateConversationId(
    "general",
    "公共聊天区"
  );
  await addMemberIfMissing(generalConversationId, user.id);
  const token = jwt.sign({ sub: username }, env.jwtSecret, { expiresIn: "7d" });
  res.json({
    token,
    profile: {
      username: user.username,
      displayName: user.display_name,
      avatarColor: (user as any).avatar_color,
      avatarUrl: (user as any).avatar_url ?? null,
      status: "online"
    }
  });
});

export default router;
