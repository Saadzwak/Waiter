import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getSelectedRestaurant,
  getDashboardStats,
  getRecentSessions,
} from "@/modules/dashboard/queries";
import { UtensilsCrossed, BarChart2, Settings, MessageSquare } from "lucide-react";

function KpiCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-1 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getSelectedRestaurant(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const [stats, sessions] = await Promise.all([
    getDashboardStats(restaurant.id),
    getRecentSessions(restaurant.id, 5),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">{restaurant.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Active for {daysSince(restaurant.created_at)} days
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Total sessions"
          value={stats.totalSessions.toLocaleString()}
        />
        <KpiCard
          label="Sessions (30d)"
          value={stats.sessions30d.toLocaleString()}
        />
        <KpiCard
          label="Messages (30d)"
          value={stats.messages30d.toLocaleString()}
          subtitle={
            stats.avgMessagesPerSession > 0
              ? `~${stats.avgMessagesPerSession} per session`
              : undefined
          }
        />
        <KpiCard
          label="Menu items"
          value={stats.totalMenuItems.toLocaleString()}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/menu"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Edit menu
          </Link>
          {[
            { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
            { label: "Settings", href: "/dashboard/settings", icon: Settings },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Recent conversations</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      {s.message_count} message{s.message_count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
                  </div>
                </div>
                {s.language_detected && (
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {s.language_detected}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
