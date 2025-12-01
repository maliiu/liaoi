import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@chat/ui";
import { useAuthStore } from "../store/useAuthStore";

interface FriendRequest {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: string;
  requester_name?: string;
  requester_display_name?: string;
}

interface FriendItem {
  username: string;
  display_name?: string;
  status: string;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

interface Props {
  onOpenChat: (conversationId: string) => void;
}

export default function FriendsView({ onOpenChat }: Props) {
  const token = useAuthStore((state) => state.token);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [target, setTarget] = useState("");

  async function load() {
    if (!token) return;
    const res = await client.get("/friends", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFriends(res.data.friends ?? []);
    setRequests(res.data.requests ?? []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [token]);

  async function sendRequest() {
    if (!target.trim()) return;
    await client.post(
      "/friends/request",
      { target },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setTarget("");
    await load();
  }

  async function accept(requestId: number) {
    const res = await client.post(
      "/friends/accept",
      { requestId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await load();
    if (res.data.conversationId) {
      onOpenChat(res.data.conversationId);
    }
  }

  return (
    <div className="friends-card">
      <h3>好友管理</h3>
      <div className="friend-form">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="输入好友昵称"
        />
        <Button onClick={sendRequest} disabled={!target.trim()}>
          发送请求
        </Button>
      </div>

      <div className="section">
        <p className="section-title">待处理请求</p>
        {requests.length === 0 && <p className="hint">暂无待处理请求</p>}
        <ul className="request-list">
          {requests.map((req) => (
            <li key={req.id}>
              <span>
                来自 {req.requester_display_name || req.requester_name || req.requester_id}
              </span>
              <Button variant="secondary" onClick={() => accept(req.id)}>
                同意
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <p className="section-title">好友列表</p>
        {friends.length === 0 && <p className="hint">暂无好友</p>}
        <ul className="friend-list">
          {friends.map((f) => (
            <li key={f.username}>
              <div>
                <p className="friend-name">{f.display_name || f.username}</p>
                <p className="friend-status">状态 {f.status}</p>
              </div>
              <Button onClick={() => onOpenChat(`direct:${f.username}`)}>
                私聊
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
