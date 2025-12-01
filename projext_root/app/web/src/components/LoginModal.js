import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@chat/ui";
import { useAuthStore } from "../store/useAuthStore";
import { register as registerService } from "../services/auth";
export default function LoginModal({ onClose }) {
    const login = useAuthStore((state) => state.login);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const canSubmit = username.trim().length >= 3 && password.length >= 6 && !loading;
    async function handleSubmit(event) {
        event.preventDefault();
        if (!canSubmit)
            return;
        setError(null);
        try {
            setLoading(true);
            if (mode === "register") {
                await registerService(username, password);
            }
            await login(username, password);
            setUsername("");
            setPassword("");
            onClose?.();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "请求失败，请稍后再试";
            setError(mode === "register" ? `注册失败：${message}` : `登录失败：${message}`);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "login-overlay", children: _jsxs("form", { className: "login-card", onSubmit: handleSubmit, children: [_jsx("h2", { children: mode === "login" ? "账号登录" : "注册账号" }), _jsx("input", { autoFocus: true, placeholder: "\u7528\u6237\u540D\uFF08\u81F3\u5C11 3 \u4E2A\u5B57\u7B26\uFF09", value: username, maxLength: 32, minLength: 3, onChange: (event) => setUsername(event.target.value) }), _jsx("input", { type: "password", placeholder: "\u5BC6\u7801\uFF08\u81F3\u5C11 6 \u4F4D\uFF09", value: password, minLength: 6, maxLength: 64, onChange: (event) => setPassword(event.target.value) }), error && _jsx("span", { className: "error-tip", children: error }), _jsx(Button, { type: "submit", disabled: !canSubmit, children: loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录" }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => setMode((current) => (current === "login" ? "register" : "login")), style: { marginTop: 8 }, children: mode === "login" ? "没有账号？点击注册" : "已有账号？点击登录" })] }) }));
}
