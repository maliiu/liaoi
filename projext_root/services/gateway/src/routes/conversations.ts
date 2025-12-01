import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  addMemberIfMissing,
  ensureDirectConversation,
  listUserConversations
} from "../lib/conversations";
import { ensureUser, findUserByUsername } from "../lib/users";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const conversations = await listUserConversations(user.id);
    res.json({
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

router.post("/direct", authenticate, async (req, res, next) => {
  try {
    const username = (req as any).user?.sub;
    const targetUsername =
      typeof req.body?.target === "string" ? req.body.target.trim() : "";
    if (!targetUsername || targetUsername === username) {
      return res.status(400).json({ message: "invalid_target" });
    }
    const user =
      (await findUserByUsername(username)) ?? (await ensureUser(username));
    const target =
      (await findUserByUsername(targetUsername)) ??
      (await ensureUser(targetUsername));
    const conversation = await ensureDirectConversation(
      user.username,
      target.username
    );
    await addMemberIfMissing(conversation.id, user.id);
    await addMemberIfMissing(conversation.id, target.id);
    res.status(201).json({
      conversation: {
        id: conversation.slug,
        title: conversation.title,
        type: "direct"
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
