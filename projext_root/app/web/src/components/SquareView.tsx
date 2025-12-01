import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { deleteSquare, listSquare, postSquare, type SquarePost } from "../services/square";

export default function SquareView() {
  const [posts, setPosts] = useState<SquarePost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(initial = true) {
    const data = await listSquare(initial ? undefined : nextCursor || undefined);
    if (initial) {
      setPosts(data.posts ?? []);
    } else {
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    }
    setNextCursor(data.nextCursor ?? null);
  }

  useEffect(() => {
    load(true).catch(() => {});
  }, []);

  async function handlePost() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await postSquare(content.trim());
      setContent("");
      await load(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteSquare(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      await load(false);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="square-card">
      <h3>广场</h3>
      <div className="square-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的想法..."
          maxLength={500}
        />
        <Button onClick={handlePost} disabled={!content.trim() || loading}>
          {loading ? "发布中..." : "发布"}
        </Button>
      </div>
      <ul className="square-list">
        {posts.map((post) => (
          <li key={post.id}>
            <p className="square-content">{post.content}</p>
            <div className="square-meta">
              <span>{post.display_name || post.username}</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
              <button className="ghost-button" onClick={() => handleDelete(post.id)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
      {nextCursor && (
        <div className="square-pagination">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "加载中..." : "加载更多"}
          </Button>
        </div>
      )}
    </div>
  );
}
