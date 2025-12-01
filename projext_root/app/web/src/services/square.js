import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (token) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    return config;
});
export async function listSquare(cursor, limit = 20) {
    const res = await client.get("/square", {
        params: { cursor, limit }
    });
    return res.data;
}
export async function postSquare(content) {
    await client.post("/square", { content });
}
export async function deleteSquare(id) {
    await client.delete(`/square/${id}`);
}
