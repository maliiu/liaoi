import { Router } from "express";
import { env } from "../env";
import { getSensitiveWords, setSensitiveWords } from "../lib/sensitiveWords";
import { pool } from "../lib/db";
import { ensureUser, findUserByUsername } from "../lib/users";
import { redisClient } from "../lib/redis";
import { authenticate } from "../middleware/auth";

const router = Router();

// 仅管理员账号 + 正确的 admin token 才可访问
router.use(authenticate, (req, res, next) => {
  const token = req.headers["x-admin-token"];
  const username = (req as any).user?.sub;
  if (token !== env.adminToken || !username || username !== env.adminUsername) {
    return res.status(403).json({ message: "forbidden" });
  }
  next();
});

router.get("/sensitive-words", async (_req, res, next) => {
  try {
    const words = await getSensitiveWords();
    res.json({ words });
  } catch (error) {
    next(error);
  }
});

router.put("/sensitive-words", async (req, res, next) => {
  try {
    const words = Array.isArray(req.body?.words) ? req.body.words : [];
    const normalized = words
      .map((word: unknown) => String(word ?? "").trim())
      .filter((word: string) => word.length > 0);
    await setSensitiveWords(normalized);
    await logAudit("set_sensitive_words", null, { count: normalized.length }, req);
    res.json({ words: await getSensitiveWords() });
  } catch (error) {
    next(error);
  }
});

// 封禁用户一段时间（分钟）
router.post("/ban", async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const minutes = Math.max(1, Math.min(Number(req.body?.minutes) || 1440, 60 * 24 * 30)); // 默认一天，最长30天
    if (!username) {
      return res.status(400).json({ message: "username_required" });
    }
    const user = (await findUserByUsername(username)) ?? (await ensureUser(username));
    await pool.query("UPDATE users SET banned_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?", [
      minutes,
      user.id
    ]);
    await redisClient.publish(
      "chat:control",
      JSON.stringify({ type: "ban", username: user.username })
    );
    await logAudit("ban", user.username, { minutes }, req);
    res.json({ message: "banned", untilMinutes: minutes });
  } catch (error) {
    next(error);
  }
});

// 解除封禁
router.post("/unban", async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ message: "username_required" });
    }
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "not_found" });
    }
    await pool.query("UPDATE users SET banned_until = NULL WHERE id = ?", [user.id]);
    await redisClient.publish(
      "chat:control",
      JSON.stringify({ type: "unban", username: user.username })
    );
    await logAudit("unban", user.username, null, req);
    res.json({ message: "unbanned" });
  } catch (error) {
    next(error);
  }
});

// 警告用户（记录警告信息）
router.post("/warn", async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const message = String(req.body?.message || "").trim();
    if (!username || !message) {
      return res.status(400).json({ message: "username_and_message_required" });
    }
    const user = (await findUserByUsername(username)) ?? (await ensureUser(username));
    await pool.query("INSERT INTO admin_warnings (user_id, message) VALUES (?, ?)", [
      user.id,
      message
    ]);
    await logAudit("warn", user.username, { message }, req);
    res.json({ message: "warned" });
  } catch (error) {
    next(error);
  }
});

// 查看警告记录，可按用户名过滤
router.get("/warnings", async (req, res, next) => {
  try {
    const username = typeof req.query.username === "string" ? req.query.username.trim().toLowerCase() : "";
    let rows: any[];
    if (username) {
      rows = (
        await pool.query<any[]>(
          `SELECT w.id, u.username, u.display_name, w.message, w.created_at
             FROM admin_warnings w
             JOIN users u ON u.id = w.user_id
            WHERE u.username = ?
         ORDER BY w.created_at DESC
            LIMIT 200`,
          [username]
        )
      )[0];
    } else {
      rows = (
        await pool.query<any[]>(
          `SELECT w.id, u.username, u.display_name, w.message, w.created_at
             FROM admin_warnings w
             JOIN users u ON u.id = w.user_id
         ORDER BY w.created_at DESC
            LIMIT 200`
        )
      )[0];
    }
    res.json({ warnings: rows });
  } catch (error) {
    next(error);
  }
});

// 查看在线用户（最近 5 分钟活跃）
router.get("/online", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT username, display_name, last_seen
         FROM users
        WHERE last_seen IS NOT NULL AND last_seen >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
    );
    res.json({ online: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
});

// 删除消息记录
router.delete("/messages/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid_id" });
    }
    const [rows] = await pool.query<any[]>("SELECT id FROM messages WHERE id=? LIMIT 1", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "not_found" });
    }
    await pool.query("DELETE FROM messages WHERE id=?", [id]);
    await logAudit("delete_message", String(id), null, req);
    res.json({ message: "deleted" });
  } catch (error) {
    next(error);
  }
});

async function logAudit(action: string, target: string | null, meta: any, req: any) {
  const adminToken = (req.headers?.["x-admin-token"] as string | undefined) ?? "";
  const adminPrefix = adminToken.slice(0, 12);
  try {
    await pool.query(
      "INSERT INTO admin_audits (action, target, admin_token_prefix, meta) VALUES (?, ?, ?, ?)",
      [action, target, adminPrefix || null, meta ? JSON.stringify(meta) : null]
    );
  } catch {
    // ignore audit failures
  }
}

export default router;
