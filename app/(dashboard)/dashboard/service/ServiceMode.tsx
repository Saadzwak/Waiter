"use client";

import { useState, useTransition } from "react";
import { toggleItemAvailability } from "@/app/actions/menu";
import { cn } from "@/lib/utils";
import type { MenuItem, MenuCategory } from "@/types";

type Props = {
  restaurantName: string;
  initialItems: MenuItem[];
  categories: MenuCategory[];
};

export function ServiceMode({ restaurantName, initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  const unavailableCount = items.filter((i) => !i.available).length;

  function toggle(itemId: string, current: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, available: !current } : i))
    );
    startTransition(() => void toggleItemAvailability(itemId, !current));
  }

  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: items.filter((i) => i.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const uncategorized = items.filter((i) => !i.category_id);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              {restaurantName}
            </p>
            <h1 className="text-lg font-semibold text-gray-900 mt-0.5">Service</h1>
          </div>
          <div className="flex items-center gap-2">
            {unavailableCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {unavailableCount} 86&apos;d
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                All available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 divide-y divide-gray-50">
        {grouped.map((group) => (
          <div key={group.id}>
            <p className="px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
              {group.name}
            </p>
            {group.items.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggle} />
            ))}
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            <p className="px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
              Other
            </p>
            {uncategorized.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggle} />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No items yet — add them in the Menu editor.
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <p className="text-center text-[11px] text-gray-300 py-4 pb-6">
        Tap any item to toggle availability
      </p>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
}: {
  item: MenuItem;
  onToggle: (id: string, current: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(item.id, item.available)}
      className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50 transition-colors text-left"
    >
      <div className="min-w-0 flex-1 pr-4">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            item.available ? "text-gray-900" : "text-gray-300 line-through"
          )}
        >
          {item.name}
        </p>
        {item.price != null && (
          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
            {item.price}
            {item.currency === "EUR" ? "€" : ` ${item.currency}`}
          </p>
        )}
      </div>

      <div
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          item.available
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-500 border border-red-200"
        )}
      >
        {item.available ? "Available" : "86'd"}
      </div>
    </button>
  );
}
