import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { deleteBottle, listBottles, pickBottle, throwBottle, type DriftBottle } from "../services/drift";
import { sendMessage, DEFAULT_CONVERSATION } from "../services/messages";

export default function DriftView() {
  const [content, setContent] = useState("");
  const [picked, setPicked] = useState<DriftBottle | null>(null);
  const [loading, setLoading] = useState(false);
  const [bottles, setBottles] = useState<DriftBottle[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(initial = true) {
    const data = await listBottles(initial ? undefined : nextCursor || undefined);
    if (initial) {
      setBottles(data.bottles ?? []);
    } else {
      setBottles((prev) => [...prev, ...(data.bottles ?? [])]);
    }
    setNextCursor(data.nextCursor ?? null);
  }

  useEffect(() => {
    load(true).catch(() => {});
  }, []);

  async function handleThrow() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await throwBottle({ content: content.trim(), type: "text" });
      setContent("");
      await load(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePick() {
    setLoading(true);
    try {
      const bottle = await pickBottle();
      setPicked(bottle);
      await sendMessage(`[漂流瓶] ${bottle.content}`, DEFAULT_CONVERSATION);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteBottle(id);
    setBottles((prev) => prev.filter((b) => b.id !== id));
    if (picked?.id === id) {
      setPicked(null);
    }
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
    <div className="drift-card">
      <h3>漂流瓶</h3>
      <div className="drift-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你想扔出的瓶子..."
          maxLength={500}
        />
        <div className="drift-actions">
          <Button onClick={handleThrow} disabled={!content.trim() || loading}>
            {loading ? "扔出中..." : "扔瓶子"}
          </Button>
          <Button variant="secondary" onClick={handlePick} disabled={loading}>
            捞瓶子
          </Button>
        </div>
      </div>

      {picked && (
        <div className="drift-result">
          <p className="drift-content">{picked.content}</p>
          <span className="drift-time">
            来自 {picked.display_name || picked.username || "匿名"} ·{" "}
            {new Date(picked.created_at).toLocaleString()}
          </span>
        </div>
      )}

      <div className="drift-list">
        <h4>最新漂流瓶</h4>
        {bottles.length === 0 && <p className="hint">暂无漂流瓶</p>}
        <ul>
          {bottles.map((bottle) => (
            <li key={bottle.id}>
              <div>
                <p className="drift-content">{bottle.content}</p>
                <span className="drift-time">
                  {bottle.display_name || bottle.username || "匿名"} ·{" "}
                  {new Date(bottle.created_at).toLocaleString()}
                </span>
              </div>
              <div className="drift-actions-inline">
                <Button
                  variant="secondary"
                  onClick={() => setPicked(bottle)}
                >
                  查看
                </Button>
                <button className="ghost-button" onClick={() => handleDelete(bottle.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
        {nextCursor && (
          <div className="drift-pagination">
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "加载中..." : "加载更多"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
