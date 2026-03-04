"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTransition, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  BarChart2,
  Sparkles,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { switchRestaurant } from "@/app/actions/restaurant";
import type { Restaurant } from "@/types";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Insights", href: "/dashboard/insights", icon: Sparkles },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Mobile nav: 5 items — drop Insights, keep Service (amber)
const MOBILE_NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const SERVICE_ITEM = { label: "Service", href: "/dashboard/service", icon: Zap };

type Props = { restaurants: Restaurant[]; restaurant: Restaurant | null };

function RestaurantSwitcher({
  restaurants,
  current,
}: {
  restaurants: Restaurant[];
  current: Restaurant | null;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  if (restaurants.length <= 1) {
    return (
      <div className="pl-8 mt-2 space-y-1.5">
        {current && (
          <p className="text-xs text-gray-400 truncate">{current.name}</p>
        )}
        <Link
          href="/dashboard/onboarding"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add restaurant
        </Link>
      </div>
    );
  }

  return (
    <div className="pl-8 mt-2 relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors max-w-full"
      >
        <span className="truncate font-medium">{current?.name ?? "Select restaurant"}</span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 py-1 overflow-hidden">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setOpen(false);
                  startTransition(() => void switchRestaurant(r.id));
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="truncate">{r.name}</span>
                {r.id === current?.id && (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 ml-2" />
                )}
              </button>
            ))}
            <div className="border-t border-gray-50 mt-1 pt-1">
              <Link
                href="/dashboard/onboarding"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-emerald-600 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add restaurant
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({ restaurants, restaurant }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-100 bg-white h-screen sticky top-0">
        {/* Brand + RestaurantSwitcher */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              AIWaiter
            </span>
          </div>
          <RestaurantSwitcher restaurants={restaurants} current={restaurant} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    active ? "text-emerald-600" : "text-gray-400"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Service mode — prominent desktop link */}
        <div className="px-3 pb-2 border-t border-gray-100 pt-3">
          <Link
            href={SERVICE_ITEM.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              isActive(SERVICE_ITEM.href)
                ? "bg-amber-50 text-amber-700"
                : "text-gray-500 hover:bg-amber-50 hover:text-amber-700"
            )}
          >
            <Zap
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive(SERVICE_ITEM.href) ? "text-amber-500" : "text-gray-400"
              )}
            />
            Service
          </Link>
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav — 5 items: 4 regular + Service (amber) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100 flex items-center justify-around px-2 py-2 pb-safe">
        {MOBILE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors",
                active ? "text-emerald-600" : "text-gray-400"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {/* Service — amber, always visible */}
        <Link
          href={SERVICE_ITEM.href}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors",
            isActive(SERVICE_ITEM.href) ? "text-amber-500" : "text-amber-400"
          )}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-medium">Service</span>
        </Link>
      </nav>
    </>
  );
}
