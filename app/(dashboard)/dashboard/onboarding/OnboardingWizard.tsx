"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Upload,
  QrCode,
  ExternalLink,
  Check,
  X,
  Utensils,
} from "lucide-react";
import { createRestaurant, type RestaurantActionState } from "@/app/actions/restaurant";
import { validateCombination, deleteCombination } from "@/app/actions/menu";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/types";
import type { MealCombination } from "@/modules/dashboard/queries";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
      {!pending && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-6 bg-gray-900"
              : i === current
              ? "w-8 bg-gray-900"
              : "w-6 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

type Props = { initialRestaurant: Restaurant | null };

export function OnboardingWizard({ initialRestaurant }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialRestaurant ? 2 : 1);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <StepIndicator current={step - 1} total={4} />
      {step === 1 && (
        <StepRestaurantInfo
          onSuccess={(r) => {
            setRestaurant(r);
            setStep(2);
          }}
        />
      )}
      {step === 2 && restaurant && (
        <StepMenuUpload
          restaurant={restaurant}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && restaurant && (
        <StepCombinations
          restaurant={restaurant}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && restaurant && <StepDone restaurant={restaurant} />}
    </div>
  );
}

// ─── Step 1: Restaurant info ─────────────────────────────────────────────────

function StepRestaurantInfo({
  onSuccess,
}: {
  onSuccess: (r: Restaurant) => void;
}) {
  const [state, formAction] = useActionState<RestaurantActionState, FormData>(
    createRestaurant,
    {}
  );

  // createRestaurant redirects on success — but if it returns slug we advance locally
  // In practice, the Server Action redirects to /dashboard after creation.
  // We handle the case where we want to stay in the wizard instead.
  // Solution: use a wrapper that prevents redirect by having the action return the slug,
  // then we advance the wizard. We'll rely on the redirect behavior — the page will
  // reload and the layout will see the restaurant exists.
  // For a smoother UX we don't redirect in the action — we handle it here.

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Your restaurant
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        This will be your AI waiter&apos;s identity.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Restaurant name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="e.g. Le Comptoir"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Short description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="e.g. Traditional French bistrot in Paris"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="language_default"
            className="block text-sm font-medium text-gray-700"
          >
            Primary language
          </label>
          <select
            id="language_default"
            name="language_default"
            defaultValue="en"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors appearance-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {state.error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {state.error}
          </p>
        )}

        <SubmitButton label="Continue" />
      </form>
    </div>
  );
}

// ─── Step 2: Menu upload ─────────────────────────────────────────────────────

type JobStatus = "idle" | "uploading" | "processing" | "done" | "error";

function StepMenuUpload({
  restaurant,
  onNext,
}: {
  restaurant: Restaurant;
  onNext: () => void;
}) {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  // Poll ingestion job status via Supabase Realtime
  useEffect(() => {
    if (!jobId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ingestion_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as string;
          if (newStatus === "done") {
            setStatus("done");
            channel.unsubscribe();
          } else if (newStatus === "error") {
            setErrorMsg(payload.new.error_message ?? "Processing failed.");
            setStatus("error");
            channel.unsubscribe();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [jobId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMsg("");

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileType = ext === "pdf" ? "pdf" : "image";
    const path = `${restaurant.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-uploads")
      .upload(path, file);

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setStatus("error");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("menu-uploads")
      .getPublicUrl(path);

    const res = await fetch("/api/menu/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        fileUrl: urlData.publicUrl,
        fileType,
      }),
    });

    if (!res.ok) {
      setErrorMsg("Failed to start menu processing.");
      setStatus("error");
      return;
    }

    const { jobId: jid } = await res.json();
    setJobId(jid);
    setStatus("processing");
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Upload your menu
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Upload a PDF or photo. Our AI will extract and structure all the dishes
        automatically.
      </p>

      {status === "idle" || status === "error" ? (
        <label className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
          <Upload className="w-6 h-6 text-gray-300" />
          <span className="text-sm text-gray-400">
            PDF or image — click to browse
          </span>
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : status === "uploading" ? (
        <div className="flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border border-gray-100 bg-gray-50">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Uploading…</p>
        </div>
      ) : status === "processing" ? (
        <div className="flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border border-gray-100 bg-gray-50">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Analysing your menu…</p>
          <p className="text-xs text-gray-400">This usually takes 15–30 seconds</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border border-green-100 bg-green-50">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <p className="text-sm text-green-700 font-medium">Menu imported successfully</p>
        </div>
      )}

      {errorMsg && (
        <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {status === "done" && (
          <button
            onClick={onNext}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Meal combinations ───────────────────────────────────────────────

function StepCombinations({
  restaurant,
  onNext,
}: {
  restaurant: Restaurant;
  onNext: () => void;
}) {
  const [combos, setCombos] = useState<MealCombination[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      // Poll until combos appear (generated async after menu ingestion)
      for (let i = 0; i < 10; i++) {
        const res = await fetch(
          `/api/combinations?restaurantId=${restaurant.id}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setCombos(data as MealCombination[]);
            setLoading(false);
            if ((data as MealCombination[]).length > 0) return;
          }
        }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setLoading(false);
    }
    poll();
    return () => { cancelled = true; };
  }, [restaurant.id]);

  function handleValidate(id: string) {
    startTransition(() => validateCombination(id));
    setCombos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, validated: true } : c))
    );
  }

  function handleDelete(id: string) {
    startTransition(() => deleteCombination(id));
    setCombos((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Meal combinations
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Our AI has crafted these combos from your menu. Validate the ones you
        love — they&apos;ll be highlighted to customers.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 h-40 rounded-2xl border border-gray-100 bg-gray-50">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-400">Generating combinations…</p>
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 h-40 rounded-2xl border border-gray-100 bg-gray-50 text-center px-6">
          <Utensils className="w-5 h-5 text-gray-300" />
          <p className="text-sm text-gray-400">
            No combinations yet. Upload your menu first, or skip and come back
            later.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={`rounded-2xl border p-4 transition-colors ${
                combo.validated
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {combo.name}
                  </p>
                  {combo.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{combo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {combo.item_names.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!combo.validated ? (
                    <button
                      onClick={() => handleValidate(combo.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Validate"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="p-1.5 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(combo.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Save &amp; Continue <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Done ────────────────────────────────────────────────────────────

function StepDone({ restaurant }: { restaurant: Restaurant }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/${restaurant.slug}`
      : `https://yoursite.com/${restaurant.slug}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=180x180&bgcolor=ffffff&color=111111&margin=12`;

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-gray-900" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Your AI waiter is ready
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Print the QR code and place it on your tables.
      </p>

      {/* QR Code */}
      <div className="inline-flex flex-col items-center gap-3 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="QR Code"
          className="w-44 h-44 rounded-2xl border border-gray-100"
        />
        <a
          href={qrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <QrCode className="w-3 h-3" /> Download QR
        </a>
      </div>

      {/* Test link */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 truncate">/{restaurant.slug}</span>
        <a
          href={`/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-gray-700 flex items-center gap-1 hover:underline"
        >
          Test it <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <a
        href="/dashboard"
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        Go to dashboard
      </a>
    </div>
  );
}
