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

export async function throwBottle(payload: {
  content: string;
  type?: "text" | "voice";
  metadata?: Record<string, unknown>;
}) {
  await client.post("/drift/throw", payload);
}

export async function pickBottle() {
  const res = await client.post("/drift/pick");
  return res.data.bottle as {
    id: number;
    sender_id: number;
    username?: string;
    display_name?: string;
    content: string;
    bottle_type: string;
    metadata: any;
    created_at: string;
  };
}

export async function deleteBottle(id: number) {
  await client.delete(`/drift/${id}`);
}

export interface DriftBottle {
  id: number;
  sender_id: number;
  username?: string;
  display_name?: string;
  content: string;
  bottle_type: string;
  metadata: any;
  created_at: string;
}

export async function listBottles(cursor?: number, limit = 20) {
  const res = await client.get("/drift", { params: { cursor, limit } });
  return res.data as { bottles: DriftBottle[]; nextCursor: number | null };
}
