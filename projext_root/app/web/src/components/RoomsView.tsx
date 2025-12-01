import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

interface Room {
  slug: string;
  title: string;
  is_private: number;
}

interface RoomMember {
  username: string;
  display_name?: string;
  role: string;
  joined_at: string;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

interface Props {
  onJoin: (conversationId: string) => void;
}

export default function RoomsView({ onJoin }: Props) {
  const token = useAuthStore((state) => state.token);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [showMembersFor, setShowMembersFor] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    client
      .get("/rooms", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setRooms(res.data.rooms ?? []))
      .catch(() => {});
  }, [token]);

  async function createRoom() {
    if (!title.trim()) return;
    const res = await client.post(
      "/rooms",
      { title: title.trim(), password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const room = res.data.room;
    setRooms((prev) => [{ slug: room.id, title: room.title, is_private: room.isPrivate ? 1 : 0 }, ...prev]);
    setTitle("");
    setPassword("");
  }

  async function joinRoom(slug: string) {
    const password = window.prompt("如果有密码请填写，否则留空") ?? "";
    await client.post(
      "/rooms/join",
      { roomId: slug, password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    onJoin(slug);
  }

  async function viewMembers(slug: string) {
    setShowMembersFor(slug);
    const res = await client.get(`/rooms/${slug}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMembers(res.data.members ?? []);
  }

  return (
    <div className="rooms-card">
      <h3>房间广场</h3>
      <div className="room-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="房间名称"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="可选密码"
          type="password"
        />
        <Button onClick={createRoom} disabled={!title.trim()}>
          创建房间
        </Button>
      </div>
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.slug}>
            <div>
              <p className="room-title">{room.title}</p>
              {room.is_private ? (
                <span className="room-tag">私密</span>
              ) : (
                <span className="room-tag public">公开</span>
              )}
            </div>
            <div className="room-actions">
              <span className="room-id">{room.slug}</span>
              <Button variant="secondary" onClick={() => joinRoom(room.slug)}>
                进入
              </Button>
              <Button variant="ghost" onClick={() => viewMembers(room.slug)}>
                查看成员
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {showMembersFor && (
        <div className="room-members">
          <div className="room-members-header">
            <h4>房间成员</h4>
            <button className="ghost-button" onClick={() => setShowMembersFor(null)}>
              关闭
            </button>
          </div>
          <ul>
            {members.map((m) => (
              <li key={`${m.username}-${m.joined_at}`}>
                <span>{m.display_name || m.username}</span>
                <small>{m.role}</small>
              </li>
            ))}
          </ul>
          {members.length === 0 && <p className="hint">暂无成员</p>}
        </div>
      )}
    </div>
  );
}
