import { FormEvent, useState } from "react";
import { Button } from "@chat/ui";
import { useAuthStore } from "../store/useAuthStore";
import { register as registerService } from "../services/auth";

interface Props {
  onClose?: () => void;
}

type Mode = "login" | "register";

export default function LoginModal({ onClose }: Props) {
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    username.trim().length >= 3 && password.length >= 6 && !loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "请求失败，请稍后再试";
      setError(
        mode === "register" ? `注册失败：${message}` : `登录失败：${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-overlay">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "账号登录" : "注册账号"}</h2>
        <input
          autoFocus
          placeholder="用户名（至少 3 个字符）"
          value={username}
          maxLength={32}
          minLength={3}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          type="password"
          placeholder="密码（至少 6 位）"
          value={password}
          minLength={6}
          maxLength={64}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <span className="error-tip">{error}</span>}
        <Button type="submit" disabled={!canSubmit}>
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
        </Button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
          style={{ marginTop: 8 }}
        >
          {mode === "login" ? "没有账号？点击注册" : "已有账号？点击登录"}
        </button>
      </form>
    </div>
  );
}
