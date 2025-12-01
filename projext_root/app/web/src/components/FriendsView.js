import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@chat/ui";
import { useAuthStore } from "../store/useAuthStore";
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api"
});
export default function FriendsView({ onOpenChat }) {
    const token = useAuthStore((state) => state.token);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [target, setTarget] = useState("");
    async function load() {
        if (!token)
            return;
        const res = await client.get("/friends", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(res.data.friends ?? []);
        setRequests(res.data.requests ?? []);
    }
    useEffect(() => {
        load().catch(() => { });
    }, [token]);
    async function sendRequest() {
        if (!target.trim())
            return;
        await client.post("/friends/request", { target }, { headers: { Authorization: `Bearer ${token}` } });
        setTarget("");
        await load();
    }
    async function accept(requestId) {
        const res = await client.post("/friends/accept", { requestId }, { headers: { Authorization: `Bearer ${token}` } });
        await load();
        if (res.data.conversationId) {
            onOpenChat(res.data.conversationId);
        }
    }
    return (_jsxs("div", { className: "friends-card", children: [_jsx("h3", { children: "\u597D\u53CB\u7BA1\u7406" }), _jsxs("div", { className: "friend-form", children: [_jsx("input", { value: target, onChange: (e) => setTarget(e.target.value), placeholder: "\u8F93\u5165\u597D\u53CB\u6635\u79F0" }), _jsx(Button, { onClick: sendRequest, disabled: !target.trim(), children: "\u53D1\u9001\u8BF7\u6C42" })] }), _jsxs("div", { className: "section", children: [_jsx("p", { className: "section-title", children: "\u5F85\u5904\u7406\u8BF7\u6C42" }), requests.length === 0 && _jsx("p", { className: "hint", children: "\u6682\u65E0\u5F85\u5904\u7406\u8BF7\u6C42" }), _jsx("ul", { className: "request-list", children: requests.map((req) => (_jsxs("li", { children: [_jsxs("span", { children: ["\u6765\u81EA ", req.requester_display_name || req.requester_name || req.requester_id] }), _jsx(Button, { variant: "secondary", onClick: () => accept(req.id), children: "\u540C\u610F" })] }, req.id))) })] }), _jsxs("div", { className: "section", children: [_jsx("p", { className: "section-title", children: "\u597D\u53CB\u5217\u8868" }), friends.length === 0 && _jsx("p", { className: "hint", children: "\u6682\u65E0\u597D\u53CB" }), _jsx("ul", { className: "friend-list", children: friends.map((f) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("p", { className: "friend-name", children: f.display_name || f.username }), _jsxs("p", { className: "friend-status", children: ["\u72B6\u6001 ", f.status] })] }), _jsx(Button, { onClick: () => onOpenChat(`direct:${f.username}`), children: "\u79C1\u804A" })] }, f.username))) })] })] }));
}
