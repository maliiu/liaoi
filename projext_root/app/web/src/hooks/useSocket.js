import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "/socket.io";
export function useSocket() {
    const token = useAuthStore((state) => state.token);
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        if (!token) {
            setSocket((current) => {
                current?.disconnect();
                return null;
            });
            return;
        }
        const instance = io(SOCKET_URL, {
            transports: ["websocket"],
            auth: { token }
        });
        instance.on("chat:ban", () => {
            alert("您已被管理员封禁，连接已断开");
            useAuthStore.getState().logout();
            instance.disconnect();
        });
        setSocket(instance);
        return () => {
            instance.disconnect();
        };
    }, [token]);
    return socket;
}
