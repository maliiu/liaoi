import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

function authHeaders(token?: string) {
  const t = token || localStorage.getItem("admin_token");
  return t ? { "X-Admin-Token": t } : {};
}

export async function banUser(username: string, minutes: number, token?: string) {
  await client.post(
    "/admin/ban",
    { username, minutes },
    { headers: authHeaders(token) }
  );
}

export async function unbanUser(username: string, token?: string) {
  await client.post(
    "/admin/unban",
    { username },
    { headers: authHeaders(token) }
  );
}

export async function warnUser(username: string, message: string, token?: string) {
  await client.post(
    "/admin/warn",
    { username, message },
    { headers: authHeaders(token) }
  );
}

export async function deleteMessage(id: number, token?: string) {
  await client.delete(`/admin/messages/${id}`, {
    headers: authHeaders(token)
  });
}

export async function listOnline(token?: string) {
  const res = await client.get("/admin/online", { headers: authHeaders(token) });
  return res.data as { online: Array<{ username: string; display_name?: string; last_seen: string }>; count: number };
}

export async function getSensitiveWords(token?: string) {
  const res = await client.get("/admin/sensitive-words", { headers: authHeaders(token) });
  return res.data.words as string[];
}

export async function setSensitiveWords(words: string[], token?: string) {
  const res = await client.put(
    "/admin/sensitive-words",
    { words },
    { headers: authHeaders(token) }
  );
  return res.data.words as string[];
}

export async function getWarnings(username?: string, token?: string) {
  const res = await client.get("/admin/warnings", {
    headers: authHeaders(token),
    params: username ? { username } : {}
  });
  return res.data.warnings as Array<{
    id: number;
    username: string;
    display_name?: string;
    message: string;
    created_at: string;
  }>;
}
