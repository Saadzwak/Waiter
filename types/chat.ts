export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  restaurant_id: string;
  language_detected: string | null;
  created_at: string;
}
