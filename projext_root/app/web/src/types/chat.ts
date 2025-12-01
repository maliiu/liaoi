export interface ChatMessage {
  id?: number;
  sender: string;
  content: string;
  createdAt: string;
  type?: string;
  conversationId: string;
  status?: "active" | "recalled";
  metadata?: Record<string, unknown> | null;
}

export interface Contact {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  lastMessage: string;
}
