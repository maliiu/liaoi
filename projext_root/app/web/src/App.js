import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@chat/ui";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import LoginModal from "./components/LoginModal";
import { useAuthStore } from "./store/useAuthStore";
import { createDirectConversation, fetchProfile, updateAvatar } from "./services/profile";
import { DEFAULT_CONVERSATION } from "./services/messages";
import RoomsView from "./components/RoomsView";
import FriendsView from "./components/FriendsView";
import SquareView from "./components/SquareView";
import DriftView from "./components/DriftView";
import AdminView from "./components/AdminView";
function App() {
    const { isAuthenticated, profile } = useAuthStore();
    const logout = useAuthStore((state) => state.logout);
    const [loginVisible, setLoginVisible] = useState(!isAuthenticated);
    const [activeConversation, setActiveConversation] = useState(DEFAULT_CONVERSATION);
    const [activeTab, setActiveTab] = useState("chat");
    const { data: profileData, refetch: refetchProfile } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
        enabled: isAuthenticated
    });
    useEffect(() => {
        setLoginVisible(!isAuthenticated);
        if (isAuthenticated) {
            refetchProfile();
        }
        else {
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
        if (!target)
            return;
        await createDirectConversation(target);
        await refetchProfile();
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "app-header", children: [_jsxs("div", { children: [_jsx("p", { className: "title", children: "\u7075\u611F\u804A\u5929\u5C9B" }), _jsx("p", { className: "subtitle", children: "\u4E0E\u5168\u7403\u7F51\u53CB\u5B9E\u65F6\u7545\u804A\uFF0C\u5206\u4EAB\u751F\u6D3B\u7075\u611F\u4E0E\u521B\u610F" })] }), _jsxs("div", { className: "header-actions", children: [_jsxs("span", { children: ["\u5F53\u524D\u7528\u6237\uFF1A", profile?.displayName ?? "未登录"] }), isAuthenticated ? (_jsx(Button, { variant: "secondary", onClick: logout, children: "\u9000\u51FA" })) : (_jsx(Button, { onClick: () => setLoginVisible(true), children: "\u767B\u5F55" }))] })] }), _jsxs("main", { className: "app-main", children: [_jsxs("div", { className: "tabs", children: [_jsx("button", { className: activeTab === "chat" ? "tab active" : "tab", onClick: () => setActiveTab("chat"), children: "\u804A\u5929" }), _jsx("button", { className: activeTab === "square" ? "tab active" : "tab", onClick: () => setActiveTab("square"), children: "\u5E7F\u573A" }), _jsx("button", { className: activeTab === "rooms" ? "tab active" : "tab", onClick: () => setActiveTab("rooms"), children: "\u623F\u95F4" }), _jsx("button", { className: activeTab === "friends" ? "tab active" : "tab", onClick: () => setActiveTab("friends"), children: "\u597D\u53CB" }), _jsx("button", { className: activeTab === "drift" ? "tab active" : "tab", onClick: () => setActiveTab("drift"), children: "\u6F02\u6D41\u74F6" }), _jsx("button", { className: activeTab === "admin" ? "tab active" : "tab", onClick: () => setActiveTab("admin"), children: "\u7BA1\u7406" })] }), _jsx(Layout, { sidebar: _jsx(Sidebar, { conversations: conversations, activeConversationId: activeConversation, onSelectConversation: (id) => {
                                setActiveConversation(id);
                                setActiveTab("chat");
                            }, onCreateDirect: handleCreateDirect, profile: profileData?.profile ?? profile, onAvatarChange: async (url) => {
                                const updated = await updateAvatar(url);
                                if (updated) {
                                    useAuthStore.setState({
                                        profile: updated,
                                        isAuthenticated: true
                                    });
                                    await refetchProfile();
                                }
                            } }), main: activeTab === "square" ? (_jsx(SquareView, {})) : activeTab === "rooms" ? (_jsx(RoomsView, { onJoin: (id) => setActiveConversation(id) })) : activeTab === "friends" ? (_jsx(FriendsView, { onOpenChat: (id) => setActiveConversation(id) })) : activeTab === "drift" ? (_jsx(DriftView, {})) : activeTab === "admin" ? (_jsx(AdminView, {})) : (_jsx(ChatWindow, { conversationId: activeConversation, conversationTitle: conversations.find((c) => c.id === activeConversation)?.title ?? "聊天" })) })] }), !isAuthenticated && loginVisible && (_jsx(LoginModal, { onClose: () => {
                    if (useAuthStore.getState().isAuthenticated) {
                        setLoginVisible(false);
                    }
                } }))] }));
}
export default App;
