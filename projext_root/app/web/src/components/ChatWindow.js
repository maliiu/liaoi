import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import axios from "axios";
import { fetchMessages, recallMessage, sendMessage } from "../services/messages";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
export default function ChatWindow({ conversationId, conversationTitle }) {
    const { profile, isAuthenticated, token } = useAuthStore();
    const socket = useSocket();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef(null);
    const { data, refetch, isFetching } = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: () => fetchMessages(conversationId),
        enabled: Boolean(conversationId),
        staleTime: 30 * 1000
    });
    useEffect(() => {
        setMessages(data ?? []);
    }, [data]);
    useEffect(() => {
        if (!socket)
            return;
        const handler = (payload) => {
            if (payload.conversationId !== conversationId)
                return;
            setMessages((prev) => {
                if (payload.status === "recalled" || payload.type === "recall") {
                    return prev.map((item) => item.id === payload.id
                        ? { ...item, status: "recalled", type: "recall", content: "" }
                        : item);
                }
                if (payload.id && prev.some((item) => item.id === payload.id)) {
                    return prev;
                }
                return [...prev, payload];
            });
        };
        socket.on("chat:message", handler);
        return () => {
            socket.off("chat:message", handler);
        };
    }, [socket, conversationId]);
    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);
    async function handleSubmit(event) {
        event.preventDefault();
        if (!input.trim() || !profile)
            return;
        const created = await sendMessage(input.trim(), conversationId);
        if (created) {
            setMessages((prev) => {
                if (created.id && prev.some((item) => item.id === created.id)) {
                    return prev;
                }
                return [...prev, created];
            });
        }
        setInput("");
    }
    async function handleVoiceUpload(file) {
        if (!file || !token)
            return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await axios.post("/media/upload", form, {
                baseURL: import.meta.env.VITE_API_BASE ?? "/api",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            const mediaUrl = res.data.mediaUrl;
            const created = await sendMessage("[语音]", conversationId, "voice", {
                mediaUrl,
                filename: file.name
            });
            if (created) {
                setMessages((prev) => [...prev, created]);
            }
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setUploading(false);
        }
    }
    async function handleRecall(messageId) {
        if (!messageId)
            return;
        await recallMessage(messageId);
        setMessages((prev) => prev.map((message) => message.id === messageId
            ? { ...message, status: "recalled", type: "recall", content: "" }
            : message));
    }
    const groupedMessages = useMemo(() => {
        return messages.map((msg) => ({
            ...msg,
            timestamp: dayjs(msg.createdAt).format("HH:mm")
        }));
    }, [messages]);
    return (_jsxs("section", { className: "chat-card", children: [_jsxs("div", { className: "chat-card-header", children: [_jsxs("div", { children: [_jsx("p", { className: "chat-title", children: conversationTitle }), _jsx("p", { className: "chat-description", children: conversationId === "general"
                                    ? "实时结识新朋友，发送内容需要先登录"
                                    : "私聊仅双方可见，请友好交流" })] }), _jsx("button", { className: "ghost-button", onClick: () => refetch(), disabled: isFetching, children: isFetching ? "刷新中..." : "刷新历史" })] }), _jsxs("div", { className: "chat-history", ref: scrollRef, children: [groupedMessages.length === 0 && (_jsx("p", { className: "chat-placeholder", children: "\u8FD9\u91CC\u8FD8\u6CA1\u6709\u6D88\u606F\uFF0C\u5FEB\u6765\u7B2C\u4E00\u6761\u5427\uFF01" })), groupedMessages.map((message) => (_jsxs("div", { className: `message-bubble ${message.sender === profile?.username ? "mine" : "others"}`, children: [_jsxs("div", { className: "message-meta", children: [_jsx("span", { className: "sender", children: message.sender }), _jsx("span", { className: "time", children: message.timestamp })] }), message.status === "recalled" || message.type === "recall" ? (_jsx("p", { className: "recalled-text", children: "\u6D88\u606F\u5DF2\u88AB\u64A4\u56DE" })) : message.type === "voice" && message.metadata?.mediaUrl ? (_jsx("audio", { controls: true, src: String(message.metadata.mediaUrl) })) : (_jsx("p", { children: message.type === "text" ? message.content : "[多媒体消息]" })), message.sender === profile?.username &&
                                message.status !== "recalled" &&
                                message.id && (_jsx("button", { type: "button", className: "recall-button", onClick: () => handleRecall(message.id), children: "\u64A4\u56DE" }))] }, `${message.id ?? message.createdAt}-${message.timestamp}`)))] }), _jsxs("form", { className: "chat-form", onSubmit: handleSubmit, children: [_jsx("input", { value: input, onChange: (event) => setInput(event.target.value), placeholder: isAuthenticated ? "输入消息..." : "登录后即可发送消息", className: "chat-input", disabled: !isAuthenticated }), _jsxs("label", { className: "voice-upload", children: [_jsx("input", { type: "file", accept: "audio/*", onChange: (e) => handleVoiceUpload(e.target.files?.[0]), disabled: !isAuthenticated || uploading, style: { display: "none" } }), _jsx("span", { children: uploading ? "上传中..." : "语音" })] }), _jsx("button", { type: "submit", className: "btn-primary", disabled: !isAuthenticated, children: "\u53D1\u9001" })] })] }));
}
