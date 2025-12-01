import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Layout({ sidebar, main }) {
    return (_jsxs("div", { className: "layout", children: [_jsx("aside", { className: "layout-sidebar", children: sidebar }), _jsx("section", { className: "layout-main", children: main })] }));
}
