"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem, MenuTag } from "@/types";

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

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  items: MenuItem[];
};

export function MenuPanel({ isOpen, onClose, categories, items }: Props) {
  // ESC closes the panel — small but expected behavior on desktop.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const itemsByCategory = items.reduce<Record<string, MenuItem[]>>(
    (acc, item) => {
      const key = item.category_id ?? "uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  const uncategorized = itemsByCategory["uncategorized"] ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col transition-transform duration-300 ease-out",
          "max-h-[80dvh]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pb-8">
          {categories.map((cat) => {
            const catItems = itemsByCategory[cat.id] ?? [];
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} className="px-5 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  {cat.name}
                </h3>
                <div className="space-y-4">
                  {catItems.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}

          {uncategorized.length > 0 && (
            <div className="px-5 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Other
              </h3>
              <div className="space-y-4">
                {uncategorized.map((item) => (
                  <MenuItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {categories.length === 0 && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <p className="text-sm text-gray-400">
                The menu hasn&apos;t been added yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-start gap-3">
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
              >
                {TAG_LABELS[tag as MenuTag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {item.price != null && (
        <span className="text-sm font-semibold text-gray-900 shrink-0 tabular-nums">
          {item.price}
          {item.currency === "EUR" ? "€" : ` ${item.currency}`}
        </span>
      )}
    </div>
  );
}
