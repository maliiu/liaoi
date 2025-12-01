import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
export default function RoomsView({ onJoin }) {
    const token = useAuthStore((state) => state.token);
    const [rooms, setRooms] = useState([]);
    const [title, setTitle] = useState("");
    const [password, setPassword] = useState("");
    const [members, setMembers] = useState([]);
    const [showMembersFor, setShowMembersFor] = useState(null);
    useEffect(() => {
        if (!token)
            return;
        client
            .get("/rooms", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => setRooms(res.data.rooms ?? []))
            .catch(() => { });
    }, [token]);
    async function createRoom() {
        if (!title.trim())
            return;
        const res = await client.post("/rooms", { title: title.trim(), password }, { headers: { Authorization: `Bearer ${token}` } });
        const room = res.data.room;
        setRooms((prev) => [{ slug: room.id, title: room.title, is_private: room.isPrivate ? 1 : 0 }, ...prev]);
        setTitle("");
        setPassword("");
    }
    async function joinRoom(slug) {
        const password = window.prompt("如果有密码请填写，否则留空") ?? "";
        await client.post("/rooms/join", { roomId: slug, password }, { headers: { Authorization: `Bearer ${token}` } });
        onJoin(slug);
    }
    async function viewMembers(slug) {
        setShowMembersFor(slug);
        const res = await client.get(`/rooms/${slug}/members`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(res.data.members ?? []);
    }
    return (_jsxs("div", { className: "rooms-card", children: [_jsx("h3", { children: "\u623F\u95F4\u5E7F\u573A" }), _jsxs("div", { className: "room-form", children: [_jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u623F\u95F4\u540D\u79F0" }), _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u53EF\u9009\u5BC6\u7801", type: "password" }), _jsx(Button, { onClick: createRoom, disabled: !title.trim(), children: "\u521B\u5EFA\u623F\u95F4" })] }), _jsx("ul", { className: "room-list", children: rooms.map((room) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("p", { className: "room-title", children: room.title }), room.is_private ? (_jsx("span", { className: "room-tag", children: "\u79C1\u5BC6" })) : (_jsx("span", { className: "room-tag public", children: "\u516C\u5F00" }))] }), _jsxs("div", { className: "room-actions", children: [_jsx("span", { className: "room-id", children: room.slug }), _jsx(Button, { variant: "secondary", onClick: () => joinRoom(room.slug), children: "\u8FDB\u5165" }), _jsx(Button, { variant: "ghost", onClick: () => viewMembers(room.slug), children: "\u67E5\u770B\u6210\u5458" })] })] }, room.slug))) }), showMembersFor && (_jsxs("div", { className: "room-members", children: [_jsxs("div", { className: "room-members-header", children: [_jsx("h4", { children: "\u623F\u95F4\u6210\u5458" }), _jsx("button", { className: "ghost-button", onClick: () => setShowMembersFor(null), children: "\u5173\u95ED" })] }), _jsx("ul", { children: members.map((m) => (_jsxs("li", { children: [_jsx("span", { children: m.display_name || m.username }), _jsx("small", { children: m.role })] }, `${m.username}-${m.joined_at}`))) }), members.length === 0 && _jsx("p", { className: "hint", children: "\u6682\u65E0\u6210\u5458" })] }))] }));
}
