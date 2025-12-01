import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { deleteSquare, listSquare, postSquare } from "../services/square";
export default function SquareView() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    async function load(initial = true) {
        const data = await listSquare(initial ? undefined : nextCursor || undefined);
        if (initial) {
            setPosts(data.posts ?? []);
        }
        else {
            setPosts((prev) => [...prev, ...(data.posts ?? [])]);
        }
        setNextCursor(data.nextCursor ?? null);
    }
    useEffect(() => {
        load(true).catch(() => { });
    }, []);
    async function handlePost() {
        if (!content.trim())
            return;
        setLoading(true);
        try {
            await postSquare(content.trim());
            setContent("");
            await load(true);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleDelete(id) {
        await deleteSquare(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
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
    return (_jsxs("div", { className: "square-card", children: [_jsx("h3", { children: "\u5E7F\u573A" }), _jsxs("div", { className: "square-form", children: [_jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), placeholder: "\u5206\u4EAB\u4F60\u7684\u60F3\u6CD5...", maxLength: 500 }), _jsx(Button, { onClick: handlePost, disabled: !content.trim() || loading, children: loading ? "发布中..." : "发布" })] }), _jsx("ul", { className: "square-list", children: posts.map((post) => (_jsxs("li", { children: [_jsx("p", { className: "square-content", children: post.content }), _jsxs("div", { className: "square-meta", children: [_jsx("span", { children: post.display_name || post.username }), _jsx("span", { children: new Date(post.created_at).toLocaleString() }), _jsx("button", { className: "ghost-button", onClick: () => handleDelete(post.id), children: "\u5220\u9664" })] })] }, post.id))) }), nextCursor && (_jsx("div", { className: "square-pagination", children: _jsx(Button, { variant: "secondary", onClick: loadMore, disabled: loadingMore, children: loadingMore ? "加载中..." : "加载更多" }) }))] }));
}
