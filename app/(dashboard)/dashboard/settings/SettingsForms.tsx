"use client";

import { useActionState, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { updateRestaurant, type RestaurantActionState } from "@/app/actions/restaurant";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/types";
import { cn } from "@/lib/utils";

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
      className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export function SettingsForms({ restaurant }: { restaurant: Restaurant }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://yoursite.com";
  const slug = restaurant.slug;
  const publicUrl = `${origin}/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=180x180&bgcolor=ffffff&color=111111&margin=12`;

  return (
    <>
      {/* Restaurant info */}
      <SectionCard title="Restaurant details">
        <RestaurantInfoForm restaurant={restaurant} />
      </SectionCard>

      {/* Logo */}
      <SectionCard title="Logo">
        <LogoUploadForm restaurant={restaurant} />
      </SectionCard>

      {/* QR Code */}
      <SectionCard title="QR Code">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-36 h-36 rounded-2xl border border-gray-100 shrink-0"
          />
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Customers scan this QR code to access your AI waiter.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500 truncate flex-1">/{slug}</span>
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-gray-700 flex items-center gap-1 hover:underline"
              >
                Test <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Download QR code
            </a>
          </div>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger zone">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-700 font-medium">Delete restaurant</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">
              Permanently deletes all menus, conversations, and analytics.
            </p>
            <button
              disabled
              title="Contact support to delete your account"
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-red-400 border border-red-200 bg-red-50 opacity-40 cursor-not-allowed"
            >
              Delete restaurant
            </button>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ─── Restaurant info form ────────────────────────────────────────────────────

function RestaurantInfoForm({ restaurant }: { restaurant: Restaurant }) {
  const [state, formAction] = useActionState<RestaurantActionState, FormData>(
    updateRestaurant,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="restaurant_id" value={restaurant.id} />
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={restaurant.name}
          required
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={restaurant.description ?? ""}
          rows={2}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="language_default" className="block text-sm font-medium text-gray-700">
          Default language
        </label>
        <select
          id="language_default"
          name="language_default"
          defaultValue={restaurant.language_default}
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
      {!state.error && state && Object.keys(state).length === 0 && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Saved
        </p>
      )}

      <SubmitButton label="Save changes" />
    </form>
  );
}

// ─── Logo upload form ────────────────────────────────────────────────────────

function LogoUploadForm({ restaurant }: { restaurant: Restaurant }) {
  const [preview, setPreview] = useState<string | null>(restaurant.logo_url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);

    const fd = new FormData();
    fd.append("logo_url", urlData.publicUrl);
    fd.append("restaurant_id", restaurant.id);
    await updateRestaurant({}, fd);

    setUploading(false);
    setSaved(true);
  }

  return (
    <div className="flex items-center gap-5">
      {/* Preview */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl border border-gray-100 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden",
          uploading && "animate-pulse"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🍽️</span>
        )}
      </div>

      <div className="flex-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {uploading ? "Uploading…" : "Choose image"}
        </button>
        <p className="text-xs text-gray-400 mt-1.5">PNG, JPG or WebP — max 2 MB</p>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        {saved && (
          <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Logo saved
          </p>
        )}
      </div>
    </div>
  );
}
