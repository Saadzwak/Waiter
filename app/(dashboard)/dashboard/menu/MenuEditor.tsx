"use client";

import { useActionState, useState, useTransition, useRef, useCallback } from "react";
import { useFormStatus } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  ArrowUp,
  ArrowDown,
  Mic,
  Square,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  toggleItemAvailability,
  reorderCategories,
  type MenuActionState,
} from "@/app/actions/menu";
import type { MenuCategory, MenuItem, MenuTag } from "@/types";

// ─── Tag config ──────────────────────────────────────────────────────────────

const ALL_TAGS: MenuTag[] = [
  "vegan", "vegetarian", "gluten-free", "spicy", "nuts",
  "dairy-free", "halal", "kosher", "seafood", "popular",
];

const TAG_COLORS: Record<MenuTag, string> = {
  vegan: "bg-green-50 text-green-700 border-green-200",
  vegetarian: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "gluten-free": "bg-blue-50 text-blue-700 border-blue-200",
  spicy: "bg-red-50 text-red-700 border-red-200",
  nuts: "bg-amber-50 text-amber-700 border-amber-200",
  "dairy-free": "bg-violet-50 text-violet-700 border-violet-200",
  halal: "bg-teal-50 text-teal-700 border-teal-200",
  kosher: "bg-indigo-50 text-indigo-700 border-indigo-200",
  seafood: "bg-cyan-50 text-cyan-700 border-cyan-200",
  popular: "bg-orange-50 text-orange-700 border-orange-200",
};

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

const ALLERGENS = [
  "gluten", "dairy", "nuts", "eggs", "soy", "fish", "shellfish", "sesame",
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MAD", "TND", "XOF"];

// ─── Submit button ───────────────────────────────────────────────────────────

function SubmitButton({ label, size = "md" }: { label: string; size?: "sm" | "md" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors disabled:opacity-40",
        size === "sm"
          ? "px-3 py-1.5 text-xs bg-gray-900 text-white hover:bg-gray-700"
          : "px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-700"
      )}
    >
      {pending && <Loader2 className="w-3 h-3 animate-spin" />}
      {label}
    </button>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

type Props = {
  restaurantId: string;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
};

export function MenuEditor({ restaurantId, initialCategories, initialItems }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);

  function updateItemNotes(itemId: string, notes: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, chef_notes: notes } : it))
    );
  }
  const [addingCategory, setAddingCategory] = useState(false);
  const [, startTransition] = useTransition();

  const itemsByCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category_id ?? "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  function moveCategory(index: number, dir: -1 | 1) {
    const next = [...categories];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setCategories(next);
    startTransition(() => {
      reorderCategories(restaurantId, next.map((c) => c.id));
    });
  }

  return (
    <div className="space-y-3">
      {/* Category list */}
      {categories.map((cat, index) => (
        <CategorySection
          key={cat.id}
          category={cat}
          items={itemsByCategory[cat.id] ?? []}
          restaurantId={restaurantId}
          isFirst={index === 0}
          isLast={index === categories.length - 1}
          onMoveUp={() => moveCategory(index, -1)}
          onMoveDown={() => moveCategory(index, 1)}
          onDeleted={() => setCategories((prev) => prev.filter((c) => c.id !== cat.id))}
          onItemNotesSaved={updateItemNotes}
        />
      ))}

      {/* Uncategorized */}
      {(itemsByCategory["uncategorized"] ?? []).length > 0 && (
        <CategorySection
          key="uncategorized"
          category={{ id: "uncategorized", name: "Other", position: 9999, restaurant_id: restaurantId }}
          items={itemsByCategory["uncategorized"]}
          restaurantId={restaurantId}
          isFirst
          isLast
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          onDeleted={() => {}}
          onItemNotesSaved={updateItemNotes}
          readOnly
        />
      )}

      {/* Add category */}
      {addingCategory ? (
        <AddCategoryForm
          restaurantId={restaurantId}
          onDone={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setAddingCategory(false);
          }}
          onCancel={() => setAddingCategory(false)}
        />
      ) : (
        <button
          onClick={() => setAddingCategory(true)}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add category
        </button>
      )}
    </div>
  );
}

// ─── Category section ────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  restaurantId,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDeleted,
  onItemNotesSaved,
  readOnly,
}: {
  category: MenuCategory;
  items: MenuItem[];
  restaurantId: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleted: () => void;
  onItemNotesSaved: (itemId: string, notes: string) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-900 truncate">
            {category.name}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </button>

        {!readOnly && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditing((v) => !v)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <DeleteCategoryButton categoryId={category.id} onDeleted={onDeleted} />
          </div>
        )}
      </div>

      {/* Inline edit */}
      {editing && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <EditCategoryForm
            category={category}
            onDone={() => setEditing(false)}
          />
        </div>
      )}

      {/* Items */}
      {open && (
        <div>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} restaurantId={restaurantId} onNotesSaved={onItemNotesSaved} />
          ))}

          {/* Add item */}
          <div className="px-4 py-3">
            {addingItem ? (
              <ItemForm
                restaurantId={restaurantId}
                categoryId={category.id}
                onDone={() => setAddingItem(false)}
                onCancel={() => setAddingItem(false)}
              />
            ) : (
              <button
                onClick={() => setAddingItem(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Delete category button ──────────────────────────────────────────────────

function DeleteCategoryButton({
  categoryId,
  onDeleted,
}: {
  categoryId: string;
  onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <form
        action={async (fd) => {
          await deleteCategory({}, fd);
          onDeleted();
        }}
      >
        <input type="hidden" name="id" value={categoryId} />
        <button
          type="submit"
          className="px-2 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Edit category form ──────────────────────────────────────────────────────

function EditCategoryForm({
  category,
  onDone,
}: {
  category: MenuCategory;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<MenuActionState, FormData>(updateCategory, {});

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        onDone();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={category.id} />
      <input
        name="name"
        defaultValue={category.name}
        autoFocus
        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      />
      <SubmitButton label="Save" size="sm" />
      <button
        type="button"
        onClick={onDone}
        className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

// ─── Add category form ───────────────────────────────────────────────────────

function AddCategoryForm({
  restaurantId,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  onDone: (cat: MenuCategory) => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<MenuActionState, FormData>(createCategory, {});

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl border border-gray-200 px-4 py-3"
    >
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <div className="flex items-center gap-2">
        <input
          name="name"
          required
          autoFocus
          placeholder="Category name"
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
        <SubmitButton label="Add" size="sm" />
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.error}
        </p>
      )}
    </form>
  );
}

// ─── Item row ────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  restaurantId,
  onNotesSaved,
}: {
  item: MenuItem;
  restaurantId: string;
  onNotesSaved: (itemId: string, notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [available, setAvailable] = useState(item.available);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !available;
    setAvailable(next);
    startTransition(() => {
      toggleItemAvailability(item.id, next);
    });
  }

  return (
    <div className="border-t border-gray-50 first:border-t-0">
      <div className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50/50 transition-colors">
        {/* Availability toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 w-8 h-4 rounded-full transition-colors relative",
            available ? "bg-gray-900" : "bg-gray-200"
          )}
          title={available ? "Available" : "Unavailable"}
        >
          <span
            className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
              available ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-medium", available ? "text-gray-900" : "text-gray-400")}>
              {item.name}
            </p>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center text-[10px] font-medium border rounded-full px-1.5 py-0.5",
                  TAG_COLORS[tag as MenuTag] ?? "bg-gray-50 text-gray-500 border-gray-200"
                )}
              >
                {TAG_LABELS[tag as MenuTag] ?? tag}
              </span>
            ))}
          </div>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
          )}
          {item.chef_notes && (
            <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <Mic className="w-2.5 h-2.5" />
              Chef&apos;s notes
            </p>
          )}
        </div>

        {/* Price */}
        {item.price != null && (
          <span className="text-sm font-medium text-gray-700 shrink-0 tabular-nums">
            {item.price}
            {item.currency === "EUR" ? "€" : ` ${item.currency}`}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setVoiceOpen((v) => !v); setEditing(false); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              voiceOpen
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-300 hover:text-emerald-600 hover:bg-emerald-50"
            )}
            title="Chef voice note"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {deleting ? (
            <form
              action={async (fd) => {
                await deleteItem({}, fd);
                setDeleting(false);
              }}
              className="flex items-center gap-1"
            >
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="px-2 py-0.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleting(false)}
                className="px-1.5 py-0.5 text-xs text-gray-400"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={() => setDeleting(true)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-100">
          <ItemForm
            restaurantId={restaurantId}
            categoryId={item.category_id}
            item={item}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Inline voice note */}
      {voiceOpen && (
        <div className="px-4 pb-4 pt-3 bg-emerald-50/40 border-t border-emerald-100">
          <ItemVoiceNote
            itemId={item.id}
            itemName={item.name}
            existingNotes={item.chef_notes}
            onClose={() => setVoiceOpen(false)}
            onSaved={(notes) => onNotesSaved(item.id, notes)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Item voice note ─────────────────────────────────────────────────────────

type VoiceState =
  | { status: "idle" }
  | { status: "recording"; seconds: number }
  | { status: "processing" }
  | { status: "saved"; transcript: string }
  | { status: "error"; message: string };

function ItemVoiceNote({
  itemId,
  itemName,
  existingNotes,
  onClose,
  onSaved,
}: {
  itemId: string;
  itemName: string;
  existingNotes: string | null;
  onClose: () => void;
  onSaved: (notes: string) => void;
}) {
  const [vs, setVs] = useState<VoiceState>({ status: "idle" });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setVs({ status: "processing" });

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fd = new FormData();
        fd.append("audio", blob, `note.${mimeType.includes("webm") ? "webm" : "ogg"}`);
        fd.append("item_id", itemId);
        fd.append("item_name", itemName);

        try {
          const res = await fetch("/api/menu/voice-note", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setVs({ status: "error", message: data.error ?? "Something went wrong." });
          } else {
            setVs({ status: "saved", transcript: data.notes });
            onSaved(data.notes);
          }
        } catch {
          setVs({ status: "error", message: "Network error. Please try again." });
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      let secs = 0;
      setVs({ status: "recording", seconds: 0 });
      timerRef.current = setInterval(() => {
        secs++;
        setVs({ status: "recording", seconds: secs });
      }, 1000);
    } catch {
      setVs({ status: "error", message: "Microphone access denied." });
    }
  }, [itemId, itemName]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-emerald-700">Chef's voice note — {itemName}</p>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
      </div>

      {/* Existing notes */}
      {existingNotes && vs.status === "idle" && (
        <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Current notes</p>
          <p className="text-xs text-gray-600">{existingNotes}</p>
        </div>
      )}

      {/* IDLE */}
      {vs.status === "idle" && (
        <button
          onClick={start}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <Mic className="w-3.5 h-3.5" />
          {existingNotes ? "Record new note (replaces current)" : "Start recording"}
        </button>
      )}

      {/* RECORDING */}
      {vs.status === "recording" && (
        <button
          onClick={stop}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500 text-xs font-medium text-white hover:bg-red-600 transition-colors"
        >
          <span className="relative flex items-center justify-center w-3.5 h-3.5">
            <span className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping" />
            <Square className="w-3 h-3 fill-white" />
          </span>
          {formatTime(vs.seconds)} — Tap to stop
        </button>
      )}

      {/* PROCESSING */}
      {vs.status === "processing" && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Transcribing…
        </div>
      )}

      {/* SAVED */}
      {vs.status === "saved" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </div>
          <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2">
            <p className="text-xs text-gray-700">{vs.transcript}</p>
          </div>
          <button
            onClick={() => setVs({ status: "idle" })}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="w-3 h-3" />
            Record another
          </button>
        </div>
      )}

      {/* ERROR */}
      {vs.status === "error" && (
        <div className="space-y-1.5">
          <p className="text-xs text-red-500">{vs.message}</p>
          <button
            onClick={() => setVs({ status: "idle" })}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Item form (create + edit) ───────────────────────────────────────────────

function ItemForm({
  restaurantId,
  categoryId,
  item,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  categoryId: string | null;
  item?: MenuItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!item;
  const action = isEdit ? updateItem : createItem;
  const [state, formAction] = useActionState<MenuActionState, FormData>(action, {});
  const [selectedTags, setSelectedTags] = useState<MenuTag[]>(
    (item?.tags as MenuTag[]) ?? []
  );
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(
    item?.allergens ?? []
  );

  function toggleTag(tag: MenuTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleAllergen(a: string) {
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  return (
    <form
      action={async (fd) => {
        // Inject multi-select values
        selectedTags.forEach((t) => fd.append("tags", t));
        selectedAllergens.forEach((a) => fd.append("allergens", a));
        await formAction(fd);
        onDone();
      }}
      className="mt-3 space-y-3"
    >
      {isEdit ? (
        <input type="hidden" name="id" value={item.id} />
      ) : (
        <>
          <input type="hidden" name="restaurant_id" value={restaurantId} />
          {categoryId && <input type="hidden" name="category_id" value={categoryId} />}
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-500">Name *</label>
          <input
            name="name"
            required
            defaultValue={item?.name}
            autoFocus={!isEdit}
            placeholder="Dish name"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <input
            name="description"
            defaultValue={item?.description ?? ""}
            placeholder="Short description"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-gray-500">
            Chef&apos;s notes{" "}
            <span className="font-normal text-gray-400">— preparation, techniques, story (used by the AI, not shown to customers)</span>
          </label>
          <textarea
            name="chef_notes"
            defaultValue={item?.chef_notes ?? ""}
            placeholder="e.g. Slow-cooked 3 hours in Burgundy wine, smoked lardons, Paris mushrooms…"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item?.price ?? ""}
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Currency</label>
          <select
            name="currency"
            defaultValue={item?.currency ?? "EUR"}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-1 transition-colors",
                selectedTags.includes(tag)
                  ? TAG_COLORS[tag]
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {selectedTags.includes(tag) && <Check className="w-3 h-3 mr-1" />}
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      {/* Allergens */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">Allergens</label>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAllergen(a)}
              className={cn(
                "inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-1 capitalize transition-colors",
                selectedAllergens.includes(a)
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {selectedAllergens.includes(a) && <Check className="w-3 h-3 mr-1" />}
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Pairings */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          Pairing suggestions{" "}
          <span className="font-normal text-gray-400">(comma-separated)</span>
        </label>
        <input
          name="pairing_suggestions"
          defaultValue={item?.pairing_suggestions.join(", ") ?? ""}
          placeholder="Bordeaux, sparkling water"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <SubmitButton label={isEdit ? "Save changes" : "Add item"} size="sm" />
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
