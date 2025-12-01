import type { ReactNode } from "react";

interface LayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export default function Layout({ sidebar, main }: LayoutProps) {
  return (
    <div className="layout">
      <aside className="layout-sidebar">{sidebar}</aside>
      <section className="layout-main">{main}</section>
    </div>
  );
}
