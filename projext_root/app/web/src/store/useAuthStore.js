import { create } from "zustand";
import { login as loginService } from "../services/auth";
const storage = typeof window !== "undefined"
    ? {
        token: localStorage.getItem("token"),
        profile: localStorage.getItem("chat_profile")
    }
    : { token: null, profile: null };
const initialProfile = storage.profile
    ? (() => {
        const parsed = JSON.parse(storage.profile);
        return {
            username: parsed.username ?? "",
            displayName: parsed.displayName ?? parsed.username ?? "",
            avatarColor: parsed.avatarColor ?? "#ff7a45",
            avatarUrl: parsed.avatarUrl ?? null,
            status: parsed.status ?? "online"
        };
    })()
    : null;
export const useAuthStore = create((set) => ({
    profile: initialProfile,
    token: storage.token,
    isAuthenticated: Boolean(storage.token && initialProfile),
    login: async (username, password) => {
        const name = username.trim();
        if (!name || !password)
            return;
        const response = await loginService(name, password);
        const profileData = {
            username: response.profile.username,
            displayName: response.profile.displayName,
            avatarColor: response.profile.avatarColor,
            avatarUrl: response.profile.avatarUrl ?? null,
            status: response.profile.status
        };
        localStorage.setItem("token", response.token);
        localStorage.setItem("chat_profile", JSON.stringify(profileData));
        set({
            profile: profileData,
            token: response.token,
            isAuthenticated: true
        });
    },
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("chat_profile");
        set({
            profile: null,
            token: null,
            isAuthenticated: false
        });
    }
}));
