import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "../store/useAuthStore";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");
  if (token) {
    const headers = new AxiosHeaders(config.headers as any);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export interface ProfileResponse {
  profile: {
    username: string;
    displayName: string;
    avatarColor: string;
    avatarUrl: string | null;
    status: string;
  };
  conversations: Array<{
    id: string;
    title: string;
    type: string;
    lastMessageAt: string | null;
  }>;
}

export async function fetchProfile(): Promise<ProfileResponse> {
  const response = await client.get("/profile");
  return response.data;
}

export async function listConversations() {
  const response = await client.get("/conversations");
  return response.data.conversations as ProfileResponse["conversations"];
}

export async function createDirectConversation(target: string) {
  const response = await client.post("/conversations/direct", { target });
  return response.data.conversation as {
    id: string;
    title: string;
    type: string;
  };
}

export async function updateAvatar(avatarUrl: string | null) {
  const response = await client.patch("/profile/avatar", { avatarUrl });
  return response.data.profile as ProfileResponse["profile"];
}
