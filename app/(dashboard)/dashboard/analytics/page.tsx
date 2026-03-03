import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRestaurantByOwner,
  getDashboardStats,
  getEventTimeSeries,
  getRecentSessions,
} from "@/modules/dashboard/queries";

export const metadata = { title: "Analytics — AIWaiter" };

function KpiCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-1">{value}</p>
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

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getRestaurantByOwner(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const [stats, timeSeries, sessions] = await Promise.all([
    getDashboardStats(restaurant.id),
    getEventTimeSeries(restaurant.id, 30),
    getRecentSessions(restaurant.id, 20),
  ]);

  const maxCount = Math.max(...timeSeries.map((d) => d.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-8">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <KpiCard label="Sessions (30d)" value={stats.sessions30d} />
        <KpiCard label="Messages (30d)" value={stats.messages30d} />
        <KpiCard
          label="Avg messages"
          value={stats.avgMessagesPerSession}
          subtitle="per session"
        />
      </div>

      {/* Time series chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Messages per day — last 30 days
        </p>
        <div className="flex items-end gap-px h-28">
          {timeSeries.map((d) => (
            <div
              key={d.date}
              className="group flex-1 flex flex-col items-center justify-end gap-1"
            >
              <div
                style={{
                  height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 4 : 0)}%`,
                }}
                className="w-full bg-gray-900 rounded-t-sm min-h-0 transition-all group-hover:bg-gray-600"
                title={`${formatDay(d.date)}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        {/* X-axis labels — only show ~6 labels */}
        <div className="flex justify-between mt-2">
          {timeSeries
            .filter((_, i) => i % 5 === 0 || i === timeSeries.length - 1)
            .map((d) => (
              <span key={d.date} className="text-[10px] text-gray-400">
                {formatDay(d.date)}
              </span>
            ))}
        </div>
      </div>

      {/* Recent sessions table */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-700">Recent conversations</p>
          </div>
          <div className="divide-y divide-gray-50">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <p className="text-sm text-gray-600">{formatDate(s.created_at)}</p>
                <div className="flex items-center gap-4">
                  {s.language_detected && (
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      {s.language_detected}
                    </span>
                  )}
                  <span className="text-sm text-gray-700 tabular-nums">
                    {s.message_count} msg{s.message_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center px-6">
          <p className="text-sm text-gray-400">No conversations yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Share your QR code to get started.
          </p>
        </div>
      )}
    </div>
  );
}
