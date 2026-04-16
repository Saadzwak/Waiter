"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuPanel } from "./MenuPanel";
import type { Restaurant, MenuCategory, MenuItem, MenuTag } from "@/types";
import type { UIMessage, TextUIPart } from "ai";

type Props = {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
};

const SUGGESTION_CHIPS = [
  "What's most popular?",
  "Any vegan options?",
  "What do you recommend?",
  "Any spicy dishes?",
];

const TAG_LABELS: Record<MenuTag, string> = {
  vegan: "🌱 Vegan",
  vegetarian: "🥦 Veg",
  "gluten-free": "🌾 GF",
  spicy: "🌶️ Spicy",
  nuts: "🥜 Nuts",
  "dairy-free": "🥛 DF",
  halal: "☪️ Halal",
  kosher: "✡️ Kosher",
  seafood: "🐟 Seafood",
  popular: "⭐ Popular",
};

// Match complete dish tokens only. Partial tokens (still streaming) are
// intentionally left as plain text so the UI never flashes a broken card.
const DISH_TOKEN_RE = /\[\[dish:([0-9a-fA-F-]{8,})\]\]/g;

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextUIPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Renders **bold** and newlines — deliberately conservative. */
function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, lineIdx, lines) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={lineIdx}>
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          )
        )}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

type Segment =
  | { kind: "text"; text: string }
  | { kind: "dish"; id: string };

/**
 * Split streamed assistant text into renderable segments, interleaving
 * markdown text with dish tokens. Tokens that never close ([[dish:xxx)
 * stay in the text segment so we never render a half-parsed card.
 */
function segmentAssistantText(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const seen = new Set<string>();

  for (const match of text.matchAll(DISH_TOKEN_RE)) {
    const [, rawId] = match;
    const id = rawId.toLowerCase();
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, start) });
    }
    // Deduplicate: the model sometimes emits the same token twice.
    if (!seen.has(id)) {
      segments.push({ kind: "dish", id });
      seen.add(id);
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return segments;
}

export function ChatInterface({ restaurant, categories, items }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // O(1) lookup of items by id for DishCard rendering.
  const itemsById = useMemo(() => {
    const m = new Map<string, MenuItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  // Create session on mount
  useEffect(() => {
    fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessionId) sessionIdRef.current = data.sessionId;
      })
      .catch(console.error);
  }, [restaurant.id]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          slug: restaurant.slug,
          sessionId: sessionIdRef.current,
        }),
      }),
    [restaurant.slug]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChip = (chip: string) => {
    if (isStreaming) return;
    sendMessage({ text: chip });
  };

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          {restaurant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <span className="text-base">🍽️</span>
            </div>
          )}
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs text-gray-400">AI Waiter</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Menu
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <WelcomeScreen restaurant={restaurant} />
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                itemsById={itemsById}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — only before first message */}
      {messages.length === 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap shrink-0">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 pt-3 pb-5 pb-safe border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the menu…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-colors leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isStreaming
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            )}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 mt-2">
          AI can make mistakes. Always confirm with your waiter for allergen info.
        </p>
      </div>

      {/* Menu panel */}
      <MenuPanel
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        items={items}
      />
    </div>
  );
}

function WelcomeScreen({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
      {restaurant.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.logo_url}
          alt={restaurant.name}
          className="w-14 h-14 rounded-2xl object-cover mb-5 border border-gray-100"
        />
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-2xl">
          🍽️
        </div>
      )}
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        Welcome to {restaurant.name}
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
        I&apos;m your AI waiter. Ask me anything about the menu — dishes,
        ingredients, allergens, or recommendations.
      </p>
    </div>
  );
}

function MessageBubble({
  message,
  itemsById,
}: {
  message: UIMessage;
  itemsById: Map<string, MenuItem>;
}) {
  const isUser = message.role === "user";
  const text = getMessageText(message);

  if (!text) return null;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gray-900 text-white px-4 py-2.5 text-sm leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  const segments = segmentAssistantText(text);

  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] space-y-2">
        {segments.map((seg, i) => {
          if (seg.kind === "text") {
            const trimmed = seg.text.replace(/^\n+|\n+$/g, "");
            if (!trimmed) return null;
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-sm bg-gray-50 text-gray-800 border border-gray-100 px-4 py-2.5 text-sm leading-relaxed"
              >
                {renderMarkdown(trimmed)}
              </div>
            );
          }
          const item = itemsById.get(seg.id);
          if (!item) return null;
          return <DishCard key={`${i}-${seg.id}`} item={item} />;
        })}
      </div>
    </div>
  );
}

function DishCard({ item }: { item: MenuItem }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm max-w-[20rem]">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover bg-gray-50"
        />
      )}
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {item.name}
          </p>
          {item.price != null && (
            <span className="text-sm font-semibold text-gray-900 shrink-0 tabular-nums">
              {item.price}
              {item.currency === "EUR" ? "€" : ` ${item.currency}`}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}
        {(item.tags.length > 0 || item.allergens.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
              >
                {TAG_LABELS[tag as MenuTag] ?? tag}
              </span>
            ))}
            {item.allergens.map((a) => (
              <span
                key={`alg-${a}`}
                className="inline-flex items-center text-[10px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 capitalize"
              >
                ⚠ {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
