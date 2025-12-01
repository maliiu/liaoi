import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { deleteBottle, listBottles, pickBottle, throwBottle } from "../services/drift";
import { sendMessage, DEFAULT_CONVERSATION } from "../services/messages";
export default function DriftView() {
    const [content, setContent] = useState("");
    const [picked, setPicked] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bottles, setBottles] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    async function load(initial = true) {
        const data = await listBottles(initial ? undefined : nextCursor || undefined);
        if (initial) {
            setBottles(data.bottles ?? []);
        }
        else {
            setBottles((prev) => [...prev, ...(data.bottles ?? [])]);
        }
        setNextCursor(data.nextCursor ?? null);
    }
    useEffect(() => {
        load(true).catch(() => { });
    }, []);
    async function handleThrow() {
        if (!content.trim())
            return;
        setLoading(true);
        try {
            await throwBottle({ content: content.trim(), type: "text" });
            setContent("");
            await load(true);
        }
        finally {
            setLoading(false);
        }
    }
    async function handlePick() {
        setLoading(true);
        try {
            const bottle = await pickBottle();
            setPicked(bottle);
            await sendMessage(`[漂流瓶] ${bottle.content}`, DEFAULT_CONVERSATION);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleDelete(id) {
        await deleteBottle(id);
        setBottles((prev) => prev.filter((b) => b.id !== id));
        if (picked?.id === id) {
            setPicked(null);
        }
    }
    async function loadMore() {
        if (!nextCursor)
            return;
        setLoadingMore(true);
        try {
            await load(false);
        }
        finally {
            setLoadingMore(false);
        }
    }
    return (_jsxs("div", { className: "drift-card", children: [_jsx("h3", { children: "\u6F02\u6D41\u74F6" }), _jsxs("div", { className: "drift-form", children: [_jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), placeholder: "\u5199\u4E0B\u4F60\u60F3\u6254\u51FA\u7684\u74F6\u5B50...", maxLength: 500 }), _jsxs("div", { className: "drift-actions", children: [_jsx(Button, { onClick: handleThrow, disabled: !content.trim() || loading, children: loading ? "扔出中..." : "扔瓶子" }), _jsx(Button, { variant: "secondary", onClick: handlePick, disabled: loading, children: "\u635E\u74F6\u5B50" })] })] }), picked && (_jsxs("div", { className: "drift-result", children: [_jsx("p", { className: "drift-content", children: picked.content }), _jsxs("span", { className: "drift-time", children: ["\u6765\u81EA ", picked.display_name || picked.username || "匿名", " \u00B7", " ", new Date(picked.created_at).toLocaleString()] })] })), _jsxs("div", { className: "drift-list", children: [_jsx("h4", { children: "\u6700\u65B0\u6F02\u6D41\u74F6" }), bottles.length === 0 && _jsx("p", { className: "hint", children: "\u6682\u65E0\u6F02\u6D41\u74F6" }), _jsx("ul", { children: bottles.map((bottle) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("p", { className: "drift-content", children: bottle.content }), _jsxs("span", { className: "drift-time", children: [bottle.display_name || bottle.username || "匿名", " \u00B7", " ", new Date(bottle.created_at).toLocaleString()] })] }), _jsxs("div", { className: "drift-actions-inline", children: [_jsx(Button, { variant: "secondary", onClick: () => setPicked(bottle), children: "\u67E5\u770B" }), _jsx("button", { className: "ghost-button", onClick: () => handleDelete(bottle.id), children: "\u5220\u9664" })] })] }, bottle.id))) }), nextCursor && (_jsx("div", { className: "drift-pagination", children: _jsx(Button, { variant: "secondary", onClick: loadMore, disabled: loadingMore, children: loadingMore ? "加载中..." : "加载更多" }) }))] })] }));
}
