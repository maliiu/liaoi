import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "../store/useAuthStore";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (token) {
        const headers = new AxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
    }
    return config;
});
export async function fetchProfile() {
    const response = await client.get("/profile");
    return response.data;
}
export async function listConversations() {
    const response = await client.get("/conversations");
    return response.data.conversations;
}
export async function createDirectConversation(target) {
    const response = await client.post("/conversations/direct", { target });
    return response.data.conversation;
}
export async function updateAvatar(avatarUrl) {
    const response = await client.patch("/profile/avatar", { avatarUrl });
    return response.data.profile;
}
