import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { ensureUser, findUserByUsername } from "../lib/users";
import { pool } from "../lib/db";

const router = Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const user =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 500) {
      return res.status(400).json({ message: "content_invalid" });
    }
    await pool.query("INSERT INTO square_posts (user_id, content) VALUES (?, ?)", [
      user.id,
      content
    ]);
    res.status(201).json({ message: "ok" });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const cursor = Number(req.query.cursor) || 0;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const [rows] = await pool.query<any[]>(
      `SELECT p.id, p.content, p.created_at, u.username, u.display_name
         FROM square_posts p
         JOIN users u ON u.id = p.user_id
        WHERE (? = 0 OR p.id < ?)
        ORDER BY p.id DESC
        LIMIT ?`,
      [cursor, cursor, limit]
    );
    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;
    res.json({ posts: rows, nextCursor });
  } catch (error) {
    next(error);
  }
});

// 删除自己的广场动态
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const user =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: "invalid_id" });
    }
    const [rows] = await pool.query<any[]>(
      "SELECT user_id FROM square_posts WHERE id=? LIMIT 1",
      [postId]
    );
    if (!rows.length || rows[0].user_id !== user.id) {
      return res.status(403).json({ message: "forbidden" });
    }
    await pool.query("DELETE FROM square_posts WHERE id=?", [postId]);
    res.json({ message: "deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
