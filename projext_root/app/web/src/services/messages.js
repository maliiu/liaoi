import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "../store/useAuthStore";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
export const DEFAULT_CONVERSATION = "general";
client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (token) {
        const headers = new AxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
    }
    return config;
});
export async function fetchMessages(conversationId = DEFAULT_CONVERSATION) {
    const response = await client.get("/messages", {
        params: { conversationId }
    });
    return response.data.messages ?? [];
}
export async function sendMessage(content, conversationId = DEFAULT_CONVERSATION, type = "text", metadata = null) {
    const response = await client.post("/messages", {
        content,
        conversationId,
        type,
        metadata
    });
    return response.data.message;
}
export async function recallMessage(id) {
    const response = await client.post(`/messages/${id}/recall`);
    return response.data.message;
}
