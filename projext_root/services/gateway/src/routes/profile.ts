import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { ensureUser, findUserByUsername } from "../lib/users";
import { pool } from "../lib/db";
import { listUserConversations } from "../lib/conversations";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    if (!username) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const conversations = await listUserConversations(user.id);
    res.json({
      profile: {
        username: user.username,
        displayName: user.display_name,
        avatarColor: (user as any).avatar_color,
        avatarUrl: (user as any).avatar_url ?? null,
        status: (user as any).status ?? "online"
      },
      conversations: conversations.map((conversation) => ({
        id: conversation.slug,
        title: conversation.title,
        type: conversation.type,
        lastMessageAt: conversation.last_message_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/avatar", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    if (!username) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const avatarUrl = 
      typeof req.body?.avatarUrl === "string" ? req.body.avatarUrl.trim() : "";
    // 允许base64格式的图片
    if (avatarUrl && !/^(https?:\/\/|data:image\/)/i.test(avatarUrl)) {
      return res.status(400).json({ message: "avatar_url_invalid" });
    }
    // 增加base64图片的长度限制
    if (avatarUrl.length > 200000) {
      return res.status(400).json({ message: "avatar_url_too_long" });
    }
    const user = 
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
      avatarUrl || null,
      user.id
    ]);
    res.json({
      profile: {
        username: user.username,
        displayName: user.display_name,
        avatarColor: (user as any).avatar_color,
        avatarUrl: avatarUrl || null,
        status: (user as any).status ?? "online"
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
