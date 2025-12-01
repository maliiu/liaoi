import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/auth";
import { ensureUser, findUserByUsername } from "../lib/users";
import {
  addMemberIfMissing,
  createRoom,
  getConversationBySlug
} from "../lib/conversations";

const router = Router();

router.get("/", authenticate, async (_req, res, next) => {
  try {
    // 简单列出公开房间
    const [rows] = await (await import("../lib/db")).pool.query(
      `SELECT slug, title, is_private FROM conversations WHERE type='room' ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ rooms: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const title =
      typeof req.body?.title === "string" && req.body.title.trim().length >= 2
        ? req.body.title.trim().slice(0, 50)
        : null;
    if (!title) {
      return res.status(400).json({ message: "title_required" });
    }
    const password =
      typeof req.body?.password === "string" && req.body.password
        ? req.body.password
        : null;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const room = await createRoom(title, user.id, passwordHash);
    await addMemberIfMissing(room.id, user.id);
    res.status(201).json({
      room: {
        id: room.slug,
        title: room.title,
        isPrivate: Boolean(password)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/join", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const roomId = typeof req.body?.roomId === "string" ? req.body.roomId : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const room = await getConversationBySlug(roomId);
    if (!room || room.type !== "room") {
      return res.status(404).json({ message: "room_not_found" });
    }
    if (room.is_private) {
      const [rows] = await (await import("../lib/db")).pool.query<any[]>(
        "SELECT password_hash FROM conversations WHERE id = ? LIMIT 1",
        [room.id]
      );
      const hash = rows[0]?.password_hash as string | null;
      if (!hash || !(await bcrypt.compare(password, hash))) {
        return res.status(403).json({ message: "invalid_password" });
      }
    }
    await addMemberIfMissing(room.id, user.id);
    res.json({
      room: {
        id: room.slug,
        title: room.title,
        isPrivate: Boolean(room.is_private)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
