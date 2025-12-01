import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { ensureUser, findUserByUsername } from "../lib/users";
import { pool } from "../lib/db";

function safeParseMetadata(value: any) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const router = Router();

router.post("/throw", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const user =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const type =
      typeof req.body?.type === "string" &&
      ["text", "voice"].includes(req.body.type)
        ? req.body.type
        : "text";
    if (!content || content.length > 500) {
      return res.status(400).json({ message: "content_invalid" });
    }
    const metadata = req.body?.metadata ? JSON.stringify(req.body.metadata) : null;
    await pool.query(
      "INSERT INTO drift_bottles (sender_id, content, bottle_type, metadata) VALUES (?, ?, ?, ?)",
      [user.id, content, type, metadata]
    );
    res.status(201).json({ message: "ok" });
  } catch (error) {
    next(error);
  }
});

router.post("/pick", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const user =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const [rows] = await pool.query<any[]>(
      `SELECT b.id, b.sender_id, b.content, b.bottle_type, b.metadata, b.created_at, u.username, u.display_name
         FROM drift_bottles b
         JOIN users u ON u.id = b.sender_id
        WHERE b.picked_by IS NULL
     ORDER BY RAND()
        LIMIT 1`
    );
    if (!rows.length) {
      return res.status(404).json({ message: "empty" });
    }
    const bottle = rows[0];
    await pool.query(
      "UPDATE drift_bottles SET picked_by = ?, picked_at = NOW() WHERE id = ?",
      [user.id, bottle.id]
    );
    res.json({
      bottle: {
        ...bottle,
        metadata: safeParseMetadata(bottle.metadata)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 分页查看漂流瓶列表
router.get("/", authenticate, async (req, res, next) => {
  try {
    const cursor = Number(req.query.cursor) || 0;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const [rows] = await pool.query<any[]>(
      `SELECT b.id, b.sender_id, b.content, b.bottle_type, b.metadata, b.created_at, u.username, u.display_name
         FROM drift_bottles b
         JOIN users u ON u.id = b.sender_id
        WHERE (? = 0 OR b.id < ?)
        ORDER BY b.id DESC
        LIMIT ?`,
      [cursor, cursor, limit]
    );
    const bottles = rows.map((row) => ({
      ...row,
      metadata: safeParseMetadata(row.metadata)
    }));
    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;
    res.json({ bottles, nextCursor });
  } catch (error) {
    next(error);
  }
});

// 删除自己扔出的漂流瓶
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const user =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid_id" });
    }
    const [rows] = await pool.query<any[]>(
      "SELECT sender_id FROM drift_bottles WHERE id=? LIMIT 1",
      [id]
    );
    if (!rows.length || rows[0].sender_id !== user.id) {
      return res.status(403).json({ message: "forbidden" });
    }
    await pool.query("DELETE FROM drift_bottles WHERE id=?", [id]);
    res.json({ message: "deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
