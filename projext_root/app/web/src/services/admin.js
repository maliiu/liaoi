import axios from "axios";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
export function setAdminToken(token) {
    localStorage.setItem("admin_token", token);
}
function authHeaders(token) {
    const t = token || localStorage.getItem("admin_token");
    return t ? { "X-Admin-Token": t } : {};
}
export async function banUser(username, minutes, token) {
    await client.post("/admin/ban", { username, minutes }, { headers: authHeaders(token) });
}
export async function unbanUser(username, token) {
    await client.post("/admin/unban", { username }, { headers: authHeaders(token) });
}
export async function warnUser(username, message, token) {
    await client.post("/admin/warn", { username, message }, { headers: authHeaders(token) });
}
export async function deleteMessage(id, token) {
    await client.delete(`/admin/messages/${id}`, {
        headers: authHeaders(token)
    });
}
export async function listOnline(token) {
    const res = await client.get("/admin/online", { headers: authHeaders(token) });
    return res.data;
}
export async function getSensitiveWords(token) {
    const res = await client.get("/admin/sensitive-words", { headers: authHeaders(token) });
    return res.data.words;
}
export async function setSensitiveWords(words, token) {
    const res = await client.put("/admin/sensitive-words", { words }, { headers: authHeaders(token) });
    return res.data.words;
}
export async function getWarnings(username, token) {
    const res = await client.get("/admin/warnings", {
        headers: authHeaders(token),
        params: username ? { username } : {}
    });
    return res.data.warnings;
}
