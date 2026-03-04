import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSelectedRestaurant, getLatestInsights } from "@/modules/dashboard/queries";
import type { InsightAnalysis } from "@/modules/dashboard/queries";
import { InsightsRefreshButton } from "./InsightsRefreshButton";

export const metadata = { title: "Insights — AIWaiter" };

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-gray-500 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-gray-600 shrink-0">{value}</span>
    </div>
  );
}

function HourBar({ hour, count, max }: { hour: number; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const label = `${String(hour).padStart(2, "0")}h`;
  return (
    <div className="flex flex-col items-center gap-1" title={`${label}: ${count}`}>
      <div className="w-5 h-16 flex items-end bg-gray-50 rounded overflow-hidden">
        <div
          className="w-full bg-emerald-400 rounded transition-all"
          style={{ height: `${pct}%` }}
        />
      </div>
      {hour % 6 === 0 && (
        <span className="text-[9px] text-gray-400">{label}</span>
      )}
    </div>
  );
}

function InsightsContent({ analysis, eventCount, analysisDate }: {
  analysis: InsightAnalysis;
  eventCount: number;
  analysisDate: string;
}) {
  const maxLang = Math.max(...(analysis.languages?.map((l) => l.count) ?? [1]));
  const maxItem = Math.max(...(analysis.top_items?.map((i) => i.count) ?? [1]));
  const maxHour = Math.max(...(analysis.peak_hours?.map((h) => h.count) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {new Date(analysisDate).toLocaleDateString("en", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{eventCount} interactions analysed</p>
          </div>
          <InsightsRefreshButton />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Languages */}
        {analysis.languages && analysis.languages.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Languages
            </h3>
            <div className="space-y-2.5">
              {analysis.languages.map((l) => (
                <BarRow
                  key={l.code}
                  label={`${l.name ?? l.code} (${l.pct}%)`}
                  value={l.count}
                  max={maxLang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top items */}
        {analysis.top_items && analysis.top_items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Most queried items
            </h3>
            <div className="space-y-2.5">
              {analysis.top_items.slice(0, 8).map((item) => (
                <BarRow key={item.name} label={item.name} value={item.count} max={maxItem} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dietary signals */}
      {analysis.dietary_signals && analysis.dietary_signals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Dietary signals
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.dietary_signals.map((s) => (
              <span
                key={s.signal}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                {s.signal}
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold">
                  {s.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Peak hours */}
      {analysis.peak_hours && analysis.peak_hours.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Peak hours
          </h3>
          <div className="flex items-end gap-0.5 overflow-x-auto pb-1">
            {Array.from({ length: 24 }, (_, h) => {
              const entry = analysis.peak_hours.find((p) => p.hour === h);
              return (
                <HourBar key={h} hour={h} count={entry?.count ?? 0} max={maxHour} />
              );
            })}
          </div>
        </div>
      )}

      {/* Gaps */}
      {analysis.gaps && analysis.gaps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Gaps identified
          </h3>
          <div className="space-y-2">
            {analysis.gaps.map((gap, i) => (
              <div
                key={i}
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700"
              >
                {gap}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Recommendations
          </h3>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant = await getSelectedRestaurant(user.id);
  if (!restaurant) redirect("/dashboard/onboarding");

  const latest = await getLatestInsights(restaurant.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-gray-500">
          Daily analysis of your customers&apos; conversations — generated automatically every night.
        </p>
      </div>

      {latest ? (
        <InsightsContent
          analysis={latest.analysis}
          eventCount={latest.event_count}
          analysisDate={latest.analysis_date}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Not enough data yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Come back after your first customer conversations. Insights are generated nightly when
            there are at least 5 interactions.
          </p>
          <InsightsRefreshButton />
        </div>
      )}
    </div>
  );
}
