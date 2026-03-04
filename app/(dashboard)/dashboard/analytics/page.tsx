import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSelectedRestaurant,
  getDashboardStats,
  getEventTimeSeries,
  getEventTimeSeriesHourly,
  getRecentSessions,
} from "@/modules/dashboard/queries";
import { PeriodFilter } from "./PeriodFilter";

export const metadata = { title: "Analytics — AIWaiter" };

const VALID_DAYS = [1, 7, 30, 90];

function parseDays(raw: string | undefined): number {
  const n = Number(raw);
  return VALID_DAYS.includes(n) ? n : 30;
}

function periodLabel(days: number) {
  if (days === 1) return "Today";
  if (days === 7) return "Last 7 days";
  if (days === 30) return "Last 30 days";
  return "Last 90 days";
}

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
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
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

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function formatHour(hh: string) {
  const h = parseInt(hh, 10);
  return h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getSelectedRestaurant(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const params = await searchParams;
  const days = parseDays(params.days);
  const isToday = days === 1;

  const [stats, timeSeries, sessions] = await Promise.all([
    getDashboardStats(restaurant.id, days),
    isToday
      ? getEventTimeSeriesHourly(restaurant.id)
      : getEventTimeSeries(restaurant.id, days),
    getRecentSessions(restaurant.id, 50, days),
  ]);

  const maxCount = Math.max(...timeSeries.map((d) => d.count), 1);

  // X-axis: show ~6 evenly spaced labels
  const xLabels = isToday
    ? timeSeries.filter((_, i) => i % 6 === 0 || i === 23)
    : timeSeries.filter((_, i) => {
        const step = days <= 7 ? 1 : days <= 30 ? 5 : 15;
        return i % step === 0 || i === timeSeries.length - 1;
      });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <Suspense fallback={null}>
          <PeriodFilter current={days} />
        </Suspense>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <KpiCard
          label="Sessions"
          value={stats.sessions30d.toLocaleString()}
          subtitle={periodLabel(days)}
        />
        <KpiCard
          label="Messages"
          value={stats.messages30d.toLocaleString()}
          subtitle={periodLabel(days)}
        />
        <KpiCard
          label="Avg messages"
          value={stats.avgMessagesPerSession}
          subtitle="per session"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
        <p className="text-sm font-medium text-gray-700 mb-4">
          {isToday ? "Messages by hour — today" : `Messages per day — ${periodLabel(days).toLowerCase()}`}
        </p>
        <div className="flex items-end gap-px h-28">
          {timeSeries.map((d) => (
            <div
              key={d.date}
              className="group flex-1 flex flex-col items-center justify-end"
            >
              <div
                style={{
                  height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 4 : 0)}%`,
                }}
                className="w-full bg-gray-900 rounded-t-sm min-h-0 transition-all group-hover:bg-emerald-600"
                title={`${isToday ? formatHour(d.date) : formatDay(d.date)}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        {/* X-axis */}
        <div className="flex justify-between mt-2">
          {xLabels.map((d) => (
            <span key={d.date} className="text-[10px] text-gray-400">
              {isToday ? formatHour(d.date) : formatDay(d.date)}
            </span>
          ))}
        </div>
      </div>

      {/* Sessions table */}
      {sessions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Conversations</p>
            <span className="text-xs text-gray-400">{sessions.length} sessions</span>
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
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center px-6">
          <p className="text-sm text-gray-400">No conversations in this period.</p>
          <p className="text-xs text-gray-300 mt-1">Try a wider time range.</p>
        </div>
      )}
    </div>
  );
}
