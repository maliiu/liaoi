import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@chat/ui";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import LoginModal from "./components/LoginModal";
import { useAuthStore } from "./store/useAuthStore";
import {
  createDirectConversation,
  fetchProfile,
  updateAvatar
} from "./services/profile";
import { DEFAULT_CONVERSATION } from "./services/messages";
import RoomsView from "./components/RoomsView";
import FriendsView from "./components/FriendsView";
import SquareView from "./components/SquareView";
import DriftView from "./components/DriftView";
import AdminView from "./components/AdminView";

type TabKey = "chat" | "square" | "rooms" | "friends" | "drift" | "admin";

function App() {
  const { isAuthenticated, profile } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const [loginVisible, setLoginVisible] = useState(!isAuthenticated);
  const [activeConversation, setActiveConversation] = useState(DEFAULT_CONVERSATION);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  const adminUsername =
    (import.meta.env.VITE_ADMIN_USERNAME as string | undefined)?.toLowerCase() ??
    "guanliyuanliu";

  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: isAuthenticated
  });

  const currentUsername =
    (profileData?.profile?.username || profile?.username || "").toLowerCase();
  const isAdmin = currentUsername === adminUsername;

  useEffect(() => {
    setLoginVisible(!isAuthenticated);
    if (isAuthenticated) {
      refetchProfile();
    } else {
      setActiveConversation(DEFAULT_CONVERSATION);
    }
  }, [isAuthenticated, refetchProfile]);

  const conversations = useMemo(() => {
    if (!profileData?.conversations?.length) {
      return [
        {
          id: DEFAULT_CONVERSATION,
          title: "公共聊天区",
          type: "public",
          lastMessageAt: null
        }
      ];
    }
    return profileData.conversations;
  }, [profileData]);

  useEffect(() => {
    if (!conversations.some((item) => item.id === activeConversation)) {
      setActiveConversation(conversations[0]?.id ?? DEFAULT_CONVERSATION);
    }
  }, [conversations, activeConversation]);

  async function handleCreateDirect() {
    const target = window.prompt("输入要私聊的用户昵称");
    if (!target) return;
    await createDirectConversation(target);
    await refetchProfile();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="title">灵感聊天岛</p>
          <p className="subtitle">与全球网友实时畅聊，分享生活灵感与创意</p>
        </div>
        <div className="header-actions">
          <span>当前用户：{profile?.displayName ?? "未登录"}</span>
          {isAuthenticated ? (
            <Button variant="secondary" onClick={logout}>
              退出
            </Button>
          ) : (
            <Button onClick={() => setLoginVisible(true)}>登录</Button>
          )}
        </div>
      </header>
      <main className="app-main">
        <div className="tabs">
          <button
            className={activeTab === "chat" ? "tab active" : "tab"}
            onClick={() => setActiveTab("chat")}
          >
            聊天
          </button>
          <button
            className={activeTab === "square" ? "tab active" : "tab"}
            onClick={() => setActiveTab("square")}
          >
            广场
          </button>
          <button
            className={activeTab === "rooms" ? "tab active" : "tab"}
            onClick={() => setActiveTab("rooms")}
          >
            房间
          </button>
          <button
            className={activeTab === "friends" ? "tab active" : "tab"}
            onClick={() => setActiveTab("friends")}
          >
            好友
          </button>
          <button
            className={activeTab === "drift" ? "tab active" : "tab"}
            onClick={() => setActiveTab("drift")}
          >
            漂流瓶
          </button>
          {isAdmin && (
            <button
              className={activeTab === "admin" ? "tab active" : "tab"}
              onClick={() => setActiveTab("admin")}
            >
              管理
            </button>
          )}
        </div>
        <Layout
          sidebar={
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversation}
              onSelectConversation={(id) => {
                setActiveConversation(id);
                setActiveTab("chat");
              }}
              onCreateDirect={handleCreateDirect}
              profile={profileData?.profile ?? profile}
              onAvatarChange={async (url) => {
                const updated = await updateAvatar(url);
                if (updated) {
                  useAuthStore.setState({
                    profile: updated,
                    isAuthenticated: true
                  });
                  await refetchProfile();
                }
              }}
            />
          }
          main={
            activeTab === "square" ? (
              <SquareView />
            ) : activeTab === "rooms" ? (
              <RoomsView onJoin={(id) => setActiveConversation(id)} />
            ) : activeTab === "friends" ? (
              <FriendsView onOpenChat={(id) => setActiveConversation(id)} />
            ) : activeTab === "drift" ? (
              <DriftView />
            ) : activeTab === "admin" ? (
              isAdmin ? (
                <AdminView />
              ) : (
                <div className="admin-restricted">
                  <h2>权限不足</h2>
                  <p>只有管理员才能访问管理页面</p>
                </div>
              )
            ) : (
              <ChatWindow
                conversationId={activeConversation}
                conversationTitle={
                  conversations.find((c) => c.id === activeConversation)?.title ?? "聊天"
                }
              />
            )
          }
        />
      </main>
      {!isAuthenticated && loginVisible && (
        <LoginModal
          onClose={() => {
            if (useAuthStore.getState().isAuthenticated) {
              setLoginVisible(false);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
