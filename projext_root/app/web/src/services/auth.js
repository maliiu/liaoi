import axios from "axios";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
export async function login(username, password) {
    const response = await client.post("/auth/login", { username, password });
    return response.data;
}
export async function register(username, password) {
    await client.post("/auth/register", { username, password });
}
