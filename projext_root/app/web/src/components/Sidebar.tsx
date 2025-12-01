import { Button } from "@chat/ui";
import type { UserProfile } from "../store/useAuthStore";
import { useState } from "react";

interface ConversationItem {
  id: string;
  title: string;
  type: string;
  lastMessageAt: string | null;
}

interface Props {
  profile: UserProfile | undefined | null;
  conversations: ConversationItem[];
  activeConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateDirect: () => void;
  onAvatarChange: (url: string) => void;
}

export default function Sidebar({
  profile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateDirect,
  onAvatarChange
}: Props) {
  const initials = profile?.displayName?.[0]?.toUpperCase() ?? "?";
  const [avatarInput, setAvatarInput] = useState(profile?.avatarUrl ?? "");

  return (
    <div className="sidebar">
      <div className="sidebar-user">
        <div
          className="avatar"
          style={{
            background: profile?.avatarColor ?? undefined
          }}
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="username">{profile?.displayName ?? "游客"}</p>
          <p className="user-status">
            {profile ? `状态：${profile.status}` : "公共聊天室 · 游客模式"}
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={onCreateDirect} disabled={!profile}>
        新建私聊
      </Button>
      {profile && (
        <div className="sidebar-section">
          <div className="section-header">
            <p>头像设置</p>
          </div>
          <div className="avatar-form">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    onAvatarChange(base64);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </div>
      )}
      <div className="sidebar-section">
        <div className="section-header">
          <p>我的会话</p>
          <span>{conversations.length}</span>
        </div>
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className={
                conversation.id === activeConversationId ? "active" : ""
              }
            >
              <button onClick={() => onSelectConversation(conversation.id)}>
                <span className="conversation-title">{conversation.title}</span>
                <span className="conversation-type">
                  {conversation.type === "direct" ? "私聊" : "公共"}
                </span>
                {conversation.lastMessageAt && (
                  <span className="conversation-time">
                    {new Date(conversation.lastMessageAt).toLocaleString()}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
