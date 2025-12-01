import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import axios from "axios";
import {
  fetchMessages,
  recallMessage,
  sendMessage
} from "../services/messages";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
import type { ChatMessage } from "../types/chat";

interface Props {
  conversationId: string;
  conversationTitle: string;
}

export default function ChatWindow({
  conversationId,
  conversationTitle
}: Props) {
  const { profile, isAuthenticated, token } = useAuthStore();
  const socket = useSocket();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!socket) return;
    const handler = (payload: ChatMessage) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (payload.status === "recalled" || payload.type === "recall") {
          return prev.map((item) =>
            item.id === payload.id
              ? { ...item, status: "recalled", type: "recall", content: "" }
              : item
          );
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || !profile) return;
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

  async function handleVoiceUpload(file?: File) {
    if (!file || !token) return;
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
      const mediaUrl = res.data.mediaUrl as string;
      const created = await sendMessage("[语音]", conversationId, "voice", {
        mediaUrl,
        filename: file.name
      });
      if (created) {
        setMessages((prev) => [...prev, created]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  async function handleRecall(messageId?: number) {
    if (!messageId) return;
    await recallMessage(messageId);
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, status: "recalled", type: "recall", content: "" }
          : message
      )
    );
  }

  const groupedMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      timestamp: dayjs(msg.createdAt).format("HH:mm")
    }));
  }, [messages]);

  return (
    <section className="chat-card">
      <div className="chat-card-header">
        <div>
          <p className="chat-title">{conversationTitle}</p>
          <p className="chat-description">
            {conversationId === "general"
              ? "实时结识新朋友，发送内容需要先登录"
              : "私聊仅双方可见，请友好交流"}
          </p>
        </div>
        <button
          className="ghost-button"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "刷新中..." : "刷新历史"}
        </button>
      </div>
      <div className="chat-history" ref={scrollRef}>
        {groupedMessages.length === 0 && (
          <p className="chat-placeholder">这里还没有消息，快来第一条吧！</p>
        )}
        {groupedMessages.map((message) => (
          <div
            key={`${message.id ?? message.createdAt}-${message.timestamp}`}
            className={`message-bubble ${
              message.sender === profile?.username ? "mine" : "others"
            }`}
          >
            <div className="message-meta">
              <span className="sender">{message.sender}</span>
              <span className="time">{message.timestamp}</span>
            </div>
            {message.status === "recalled" || message.type === "recall" ? (
              <p className="recalled-text">消息已被撤回</p>
            ) : message.type === "voice" && message.metadata?.mediaUrl ? (
              <audio controls src={String(message.metadata.mediaUrl)} />
            ) : (
              <p>{message.type === "text" ? message.content : "[多媒体消息]"}</p>
            )}
            {message.sender === profile?.username &&
              message.status !== "recalled" &&
              message.id && (
                <button
                  type="button"
                  className="recall-button"
                  onClick={() => handleRecall(message.id)}
                >
                  撤回
                </button>
              )}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isAuthenticated ? "输入消息..." : "登录后即可发送消息"}
          className="chat-input"
          disabled={!isAuthenticated}
        />
        <label className="voice-upload">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => handleVoiceUpload(e.target.files?.[0])}
            disabled={!isAuthenticated || uploading}
            style={{ display: "none" }}
          />
          <span>{uploading ? "上传中..." : "语音"}</span>
        </label>
        <button type="submit" className="btn-primary" disabled={!isAuthenticated}>
          发送
        </button>
      </form>
    </section>
  );
}
