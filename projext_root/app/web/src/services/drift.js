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
export async function throwBottle(payload) {
    await client.post("/drift/throw", payload);
}
export async function pickBottle() {
    const res = await client.post("/drift/pick");
    return res.data.bottle;
}
export async function deleteBottle(id) {
    await client.delete(`/drift/${id}`);
}
export async function listBottles(cursor, limit = 20) {
    const res = await client.get("/drift", { params: { cursor, limit } });
    return res.data;
}
