import { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import {
  banUser,
  deleteMessage,
  getSensitiveWords,
  listOnline,
  setAdminToken,
  setSensitiveWords,
  unbanUser,
  warnUser,
  getWarnings
} from "../services/admin";

export default function AdminView() {
  const [adminToken, updateAdminToken] = useState(localStorage.getItem("admin_token") || "");
  const [banUserName, setBanUserName] = useState("");
  const [banMinutes, setBanMinutes] = useState(1440);
  const [unbanUserName, setUnbanUserName] = useState("");
  const [warnUserName, setWarnUserName] = useState("");
  const [warnMessage, setWarnMessage] = useState("");
  const [messageId, setMessageId] = useState("");
  const [online, setOnline] = useState<any[]>([]);
  const [sensitiveWords, setWords] = useState<string[]>([]);
  const [wordsText, setWordsText] = useState("");
  const [warningQuery, setWarningQuery] = useState("");
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    if (adminToken) {
      setAdminToken(adminToken);
      refreshOnline().catch(() => {});
      refreshWords().catch(() => {});
      refreshWarnings().catch(() => {});
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

  return (
    <div className="admin-card">
      <h3>管理员控制台</h3>
      <div className="admin-grid">
        <div className="admin-section">
          <p className="section-title">令牌</p>
          <input
            value={adminToken}
            onChange={(e) => updateAdminToken(e.target.value)}
            placeholder="X-Admin-Token"
          />
          <p className="hint">保存在浏览器本地，仅当前设备生效。</p>
        </div>

        <div className="admin-section">
          <p className="section-title">封禁 / 解封</p>
          <div className="admin-row">
            <input
              value={banUserName}
              onChange={(e) => setBanUserName(e.target.value)}
              placeholder="用户名"
            />
            <input
              type="number"
              value={banMinutes}
              onChange={(e) => setBanMinutes(Number(e.target.value))}
              min={1}
              max={43200}
              placeholder="分钟"
            />
            <Button
              onClick={async () => {
                if (!window.confirm(`确认封禁 ${banUserName} 吗？`)) return;
                await banUser(banUserName.trim(), banMinutes, adminToken);
                setBanUserName("");
                await refreshOnline();
              }}
              disabled={!banUserName.trim()}
            >
              封禁
            </Button>
          </div>
          <div className="admin-row">
            <input
              value={unbanUserName}
              onChange={(e) => setUnbanUserName(e.target.value)}
              placeholder="用户名"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (!window.confirm(`确认解封 ${unbanUserName} 吗？`)) return;
                await unbanUser(unbanUserName.trim(), adminToken);
                setUnbanUserName("");
                await refreshOnline();
              }}
              disabled={!unbanUserName.trim()}
            >
              解封
            </Button>
          </div>
        </div>

        <div className="admin-section">
          <p className="section-title">警告</p>
          <div className="admin-row">
            <input
              value={warnUserName}
              onChange={(e) => setWarnUserName(e.target.value)}
              placeholder="用户名"
            />
            <input
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              placeholder="警告内容"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (!window.confirm(`向 ${warnUserName} 发送警告？`)) return;
                await warnUser(warnUserName.trim(), warnMessage.trim(), adminToken);
                setWarnMessage("");
              }}
              disabled={!warnUserName.trim() || !warnMessage.trim()}
            >
              发送警告
            </Button>
          </div>
          <div className="admin-row">
            <input
              value={warningQuery}
              onChange={(e) => setWarningQuery(e.target.value)}
              placeholder="按用户名过滤警告（可留空）"
            />
            <Button variant="ghost" onClick={refreshWarnings}>
              查看警告
            </Button>
          </div>
          <ul className="online-list">
            {warnings.map((w) => (
              <li key={w.id}>
                <span>{w.display_name || w.username}</span>
                <small>{new Date(w.created_at).toLocaleString()}</small>
                <small>{w.message}</small>
              </li>
            ))}
            {warnings.length === 0 && <li className="hint">暂无警告记录</li>}
          </ul>
        </div>

        <div className="admin-section">
          <p className="section-title">删除消息</p>
          <div className="admin-row">
            <input
              value={messageId}
              onChange={(e) => setMessageId(e.target.value)}
              placeholder="消息ID"
            />
            <Button
              variant="secondary"
              onClick={async () => {
                const id = Number(messageId);
                if (!Number.isInteger(id)) return;
                if (!window.confirm(`确认删除消息 ${id} 吗？`)) return;
                await deleteMessage(id, adminToken);
                setMessageId("");
              }}
              disabled={!messageId.trim()}
            >
              删除
            </Button>
          </div>
        </div>

        <div className="admin-section">
          <p className="section-title">敏感词</p>
          <textarea
            value={wordsText}
            onChange={(e) => setWordsText(e.target.value)}
            rows={6}
            placeholder="每行一个敏感词"
          />
          <div className="admin-row">
            <Button
              variant="secondary"
              onClick={async () => {
                const words = wordsText
                  .split("\n")
                  .map((w) => w.trim())
                  .filter(Boolean);
                const saved = await setSensitiveWords(words, adminToken);
                setWords(saved);
                setWordsText(saved.join("\n"));
              }}
            >
              保存
            </Button>
            <Button variant="ghost" onClick={refreshWords}>
              刷新
            </Button>
          </div>
          <p className="hint">当前 {sensitiveWords.length} 个敏感词。</p>
        </div>

        <div className="admin-section">
          <div className="admin-row admin-row-space">
            <p className="section-title">在线用户</p>
            <Button variant="ghost" onClick={refreshOnline}>
              刷新
            </Button>
          </div>
          <ul className="online-list">
            {online.map((u) => (
              <li key={u.username}>
                <span>{u.display_name || u.username}</span>
                <small>{new Date(u.last_seen).toLocaleString()}</small>
              </li>
            ))}
            {online.length === 0 && <li className="hint">暂无在线</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
