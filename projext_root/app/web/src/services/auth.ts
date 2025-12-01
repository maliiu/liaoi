import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});

export interface LoginResponse {
  token: string;
  profile: {
    username: string;
    displayName: string;
    avatarColor: string;
    avatarUrl?: string | null;
    status: string;
  };
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await client.post("/auth/login", { username, password });
  return response.data as LoginResponse;
}

export async function register(username: string, password: string) {
  await client.post("/auth/register", { username, password });
}
