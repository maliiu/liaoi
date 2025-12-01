import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem("token");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any;
  }
  return config;
});

export interface SquarePost {
  id: number;
  content: string;
  created_at: string;
  username: string;
  display_name?: string;
}

export interface SquareListResponse {
  posts: SquarePost[];
  nextCursor: number | null;
}

export async function listSquare(cursor?: number, limit = 20): Promise<SquareListResponse> {
  const res = await client.get("/square", {
    params: { cursor, limit }
  });
  return res.data as SquareListResponse;
}

export async function postSquare(content: string) {
  await client.post("/square", { content });
}

export async function deleteSquare(id: number) {
  await client.delete(`/square/${id}`);
}
