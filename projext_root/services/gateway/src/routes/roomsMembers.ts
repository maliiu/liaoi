import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { pool } from "../lib/db";
import { ensureUser, findUserByUsername } from "../lib/users";

const router = Router();

router.get("/:slug/members", authenticate, async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const me = (req as any).user?.sub;
    await ensureUser(me); // ensure exists
    const [rows] = await pool.query<any[]>(
      `SELECT u.username, u.display_name, cm.role, cm.joined_at
         FROM conversations c
         JOIN conversation_members cm ON cm.conversation_id = c.id
         JOIN users u ON u.id = cm.user_id
        WHERE c.slug = ?`,
      [slug]
    );
    res.json({ members: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
