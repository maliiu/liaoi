# 架构概览

```
┌─────────────┐     REST     ┌─────────────┐     MySQL
│  React Web  │ <----------> │  Gateway    │ <-----------┐
│  (Vite)     │              │  (Express)  │             │
└─────┬───────┘              └─────┬───────┘             │
      │   Socket.IO                  │ Redis Pub/Sub     │
      ▼                              ▼                   │
┌─────────────┐   Subscribe   ┌─────────────┐            │
│  Chat Svc   │ <-----------> │  Redis      │            │
│ (Fastify)   │               └─────┬───────┘            │
└─────┬───────┘                     │                    │
      │                             ▼                    │
      │                        ┌─────────────┐           │
      │                        │ Tasks Svc   │  MongoDB  │
      └────────────────────────┴─────────────┴───────────┘
```

- **Web**：负责 UI、登录、消息输入；通过 React Query 拉取历史消息，Socket.IO 接收实时事件。
- **Gateway**：REST 入口（/api），提供登录、消息 CRUD；写 MySQL 并向 Redis 发布消息对象。
- **Chat**：WebSocket 服务，验证 JWT 后转发 Redis 频道消息给所有客户端，实现实时同步。
- **Tasks**：订阅同一 Redis 频道，将消息写入 MongoDB，便于扩展检索/风控。
- **Infra**：docker-compose 启动所有依赖，Nginx 暴露统一入口 `/`、`/api`、`/socket.io`。

## 数据流
1. 用户通过 `POST /api/auth/login` 获取 JWT，并在浏览器存储 token。
2. 发送消息 -> Gateway 写入 MySQL，同时把 `{ id, sender, content, createdAt }` 发布到 `chat:message`。
3. Chat 服务订阅该频道并通过 Socket.IO 广播；任务服务写入 MongoDB 备份。
4. 浏览器端使用 REST 获取历史消息，再通过 Socket 渲染实时气泡。

## 数据库 & 缓存
- **MySQL**：`messages(id, sender, content, room, created_at)`。
- **MongoDB**：`messages` 集合记录 Redis 订阅到的所有消息，可扩展全文索引。
- **Redis**：消息分发频道和在线状态（后续可扩展为会话房间、速率限制等）。

## 安全
- JWT 保护写消息与 Socket 连接。
- Express Rate Limit & Helmet 提供基本防护。
- Nginx 统一入口便于开启 HTTPS、gzip、缓存策略。
