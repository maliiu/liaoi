import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import type { ChatMessage } from "../types/chat";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

export const DEFAULT_CONVERSATION = "general";

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");
  if (token) {
    const headers = new AxiosHeaders(config.headers as any);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export async function fetchMessages(
  conversationId = DEFAULT_CONVERSATION
): Promise<ChatMessage[]> {
  const response = await client.get("/messages", {
    params: { conversationId }
  });
  return response.data.messages ?? [];
}

export async function sendMessage(
  content: string,
  conversationId = DEFAULT_CONVERSATION,
  type: string = "text",
  metadata: Record<string, unknown> | null = null
) {
  const response = await client.post("/messages", {
    content,
    conversationId,
    type,
    metadata
  });
  return response.data.message as ChatMessage;
}

export async function recallMessage(id: number) {
  const response = await client.post(`/messages/${id}/recall`);
  return response.data.message as Partial<ChatMessage>;
}
