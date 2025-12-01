import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { ensureUser, findUserByUsername } from "../lib/users";
import { pool } from "../lib/db";
import {
  addMemberIfMissing,
  ensureDirectConversation
} from "../lib/conversations";

const router = Router();

router.post("/request", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const target =
      typeof req.body?.target === "string" ? req.body.target.trim() : "";
    if (!me || !target || me === target) {
      return res.status(400).json({ message: "invalid_target" });
    }
    const requester =
      (await findUserByUsername(me)) ?? (await ensureUser(me));
    const addressee =
      (await findUserByUsername(target)) ?? (await ensureUser(target));
    await pool.query(
      `INSERT INTO friend_requests (requester_id, addressee_id, status)
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status='pending'`,
      [requester.id, addressee.id]
    );
    res.status(201).json({ message: "requested" });
  } catch (error) {
    next(error);
  }
});

router.post("/accept", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const requestId = Number(req.body?.requestId);
    if (!me || !Number.isInteger(requestId)) {
      return res.status(400).json({ message: "invalid_request" });
    }
    const meUser = (await findUserByUsername(me)) ?? (await ensureUser(me));
    const [rows] = await pool.query<any[]>(
      "SELECT id, requester_id, addressee_id, status FROM friend_requests WHERE id=? LIMIT 1",
      [requestId]
    );
    const request = rows[0];
    if (!request || request.addressee_id !== meUser.id) {
      return res.status(404).json({ message: "not_found" });
    }
    await pool.query("UPDATE friend_requests SET status='accepted' WHERE id=?", [
      requestId
    ]);
    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES (?, ?, 'accepted')
       ON DUPLICATE KEY UPDATE status='accepted'`,
      [request.requester_id, request.addressee_id]
    );

    const otherId =
      request.requester_id === meUser.id
        ? request.addressee_id
        : request.requester_id;
    const [otherRow] = await pool.query<any[]>(
      "SELECT username FROM users WHERE id=? LIMIT 1",
      [otherId]
    );
    const otherName = otherRow[0]?.username as string;
    const convo = await ensureDirectConversation(meUser.username, otherName);
    await addMemberIfMissing(convo.id, meUser.id);
    await addMemberIfMissing(convo.id, otherId);

    res.json({ message: "accepted", conversationId: convo.slug });
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const me = (req as any).user?.sub;
    const meUser = (await findUserByUsername(me)) ?? (await ensureUser(me));
    const [friends] = await pool.query<any[]>(
      `SELECT u.username, u.display_name, fr.status
         FROM friendships fr
         JOIN users u ON u.id = IF(fr.requester_id=?, fr.addressee_id, fr.requester_id)
        WHERE (fr.requester_id=? OR fr.addressee_id=?) AND fr.status='accepted'`,
      [meUser.id, meUser.id, meUser.id]
    );
    const [requests] = await pool.query<any[]>(
      `SELECT fr.id,
              fr.requester_id,
              fr.addressee_id,
              fr.status,
              u.username AS requester_name,
              u.display_name AS requester_display_name
         FROM friend_requests fr
         JOIN users u ON u.id = fr.requester_id
        WHERE fr.addressee_id = ? AND fr.status='pending'`,
      [meUser.id]
    );
    res.json({ friends, requests });
  } catch (error) {
    next(error);
  }
});

export default router;
