import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { banUser, deleteMessage, getSensitiveWords, listOnline, setAdminToken, setSensitiveWords, unbanUser, warnUser, getWarnings } from "../services/admin";
export default function AdminView() {
    const [adminToken, updateAdminToken] = useState(localStorage.getItem("admin_token") || "");
    const [banUserName, setBanUserName] = useState("");
    const [banMinutes, setBanMinutes] = useState(1440);
    const [unbanUserName, setUnbanUserName] = useState("");
    const [warnUserName, setWarnUserName] = useState("");
    const [warnMessage, setWarnMessage] = useState("");
    const [messageId, setMessageId] = useState("");
    const [online, setOnline] = useState([]);
    const [sensitiveWords, setWords] = useState([]);
    const [wordsText, setWordsText] = useState("");
    const [warningQuery, setWarningQuery] = useState("");
    const [warnings, setWarnings] = useState([]);
    useEffect(() => {
        if (adminToken) {
            setAdminToken(adminToken);
            refreshOnline().catch(() => { });
            refreshWords().catch(() => { });
            refreshWarnings().catch(() => { });
        }
    }, [adminToken]);
    async function refreshOnline() {
        const data = await listOnline(adminToken);
        setOnline(data.online || []);
    }
    async function refreshWords() {
        const words = await getSensitiveWords(adminToken);
        setWords(words);
        setWordsText(words.join("\n"));
    }
    async function refreshWarnings() {
        const list = await getWarnings(warningQuery.trim() || undefined, adminToken);
        setWarnings(list ?? []);
    }
    return (_jsxs("div", { className: "admin-card", children: [_jsx("h3", { children: "\u7BA1\u7406\u5458\u63A7\u5236\u53F0" }), _jsxs("div", { className: "admin-grid", children: [_jsxs("div", { className: "admin-section", children: [_jsx("p", { className: "section-title", children: "\u4EE4\u724C" }), _jsx("input", { value: adminToken, onChange: (e) => updateAdminToken(e.target.value), placeholder: "X-Admin-Token" }), _jsx("p", { className: "hint", children: "\u4FDD\u5B58\u5728\u6D4F\u89C8\u5668\u672C\u5730\uFF0C\u4EC5\u5F53\u524D\u8BBE\u5907\u751F\u6548\u3002" })] }), _jsxs("div", { className: "admin-section", children: [_jsx("p", { className: "section-title", children: "\u5C01\u7981 / \u89E3\u5C01" }), _jsxs("div", { className: "admin-row", children: [_jsx("input", { value: banUserName, onChange: (e) => setBanUserName(e.target.value), placeholder: "\u7528\u6237\u540D" }), _jsx("input", { type: "number", value: banMinutes, onChange: (e) => setBanMinutes(Number(e.target.value)), min: 1, max: 43200, placeholder: "\u5206\u949F" }), _jsx(Button, { onClick: async () => {
                                            if (!window.confirm(`确认封禁 ${banUserName} 吗？`))
                                                return;
                                            await banUser(banUserName.trim(), banMinutes, adminToken);
                                            setBanUserName("");
                                            await refreshOnline();
                                        }, disabled: !banUserName.trim(), children: "\u5C01\u7981" })] }), _jsxs("div", { className: "admin-row", children: [_jsx("input", { value: unbanUserName, onChange: (e) => setUnbanUserName(e.target.value), placeholder: "\u7528\u6237\u540D" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                            if (!window.confirm(`确认解封 ${unbanUserName} 吗？`))
                                                return;
                                            await unbanUser(unbanUserName.trim(), adminToken);
                                            setUnbanUserName("");
                                            await refreshOnline();
                                        }, disabled: !unbanUserName.trim(), children: "\u89E3\u5C01" })] })] }), _jsxs("div", { className: "admin-section", children: [_jsx("p", { className: "section-title", children: "\u8B66\u544A" }), _jsxs("div", { className: "admin-row", children: [_jsx("input", { value: warnUserName, onChange: (e) => setWarnUserName(e.target.value), placeholder: "\u7528\u6237\u540D" }), _jsx("input", { value: warnMessage, onChange: (e) => setWarnMessage(e.target.value), placeholder: "\u8B66\u544A\u5185\u5BB9" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                            if (!window.confirm(`向 ${warnUserName} 发送警告？`))
                                                return;
                                            await warnUser(warnUserName.trim(), warnMessage.trim(), adminToken);
                                            setWarnMessage("");
                                        }, disabled: !warnUserName.trim() || !warnMessage.trim(), children: "\u53D1\u9001\u8B66\u544A" })] }), _jsxs("div", { className: "admin-row", children: [_jsx("input", { value: warningQuery, onChange: (e) => setWarningQuery(e.target.value), placeholder: "\u6309\u7528\u6237\u540D\u8FC7\u6EE4\u8B66\u544A\uFF08\u53EF\u7559\u7A7A\uFF09" }), _jsx(Button, { variant: "ghost", onClick: refreshWarnings, children: "\u67E5\u770B\u8B66\u544A" })] }), _jsxs("ul", { className: "online-list", children: [warnings.map((w) => (_jsxs("li", { children: [_jsx("span", { children: w.display_name || w.username }), _jsx("small", { children: new Date(w.created_at).toLocaleString() }), _jsx("small", { children: w.message })] }, w.id))), warnings.length === 0 && _jsx("li", { className: "hint", children: "\u6682\u65E0\u8B66\u544A\u8BB0\u5F55" })] })] }), _jsxs("div", { className: "admin-section", children: [_jsx("p", { className: "section-title", children: "\u5220\u9664\u6D88\u606F" }), _jsxs("div", { className: "admin-row", children: [_jsx("input", { value: messageId, onChange: (e) => setMessageId(e.target.value), placeholder: "\u6D88\u606FID" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                            const id = Number(messageId);
                                            if (!Number.isInteger(id))
                                                return;
                                            if (!window.confirm(`确认删除消息 ${id} 吗？`))
                                                return;
                                            await deleteMessage(id, adminToken);
                                            setMessageId("");
                                        }, disabled: !messageId.trim(), children: "\u5220\u9664" })] })] }), _jsxs("div", { className: "admin-section", children: [_jsx("p", { className: "section-title", children: "\u654F\u611F\u8BCD" }), _jsx("textarea", { value: wordsText, onChange: (e) => setWordsText(e.target.value), rows: 6, placeholder: "\u6BCF\u884C\u4E00\u4E2A\u654F\u611F\u8BCD" }), _jsxs("div", { className: "admin-row", children: [_jsx(Button, { variant: "secondary", onClick: async () => {
                                            const words = wordsText
                                                .split("\n")
                                                .map((w) => w.trim())
                                                .filter(Boolean);
                                            const saved = await setSensitiveWords(words, adminToken);
                                            setWords(saved);
                                            setWordsText(saved.join("\n"));
                                        }, children: "\u4FDD\u5B58" }), _jsx(Button, { variant: "ghost", onClick: refreshWords, children: "\u5237\u65B0" })] }), _jsxs("p", { className: "hint", children: ["\u5F53\u524D ", sensitiveWords.length, " \u4E2A\u654F\u611F\u8BCD\u3002"] })] }), _jsxs("div", { className: "admin-section", children: [_jsxs("div", { className: "admin-row admin-row-space", children: [_jsx("p", { className: "section-title", children: "\u5728\u7EBF\u7528\u6237" }), _jsx(Button, { variant: "ghost", onClick: refreshOnline, children: "\u5237\u65B0" })] }), _jsxs("ul", { className: "online-list", children: [online.map((u) => (_jsxs("li", { children: [_jsx("span", { children: u.display_name || u.username }), _jsx("small", { children: new Date(u.last_seen).toLocaleString() })] }, u.username))), online.length === 0 && _jsx("li", { className: "hint", children: "\u6682\u65E0\u5728\u7EBF" })] })] })] })] }));
}
