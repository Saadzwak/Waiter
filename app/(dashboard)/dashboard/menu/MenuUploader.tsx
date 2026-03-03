"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, FileText, ImageIcon, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "processing" }
  | { phase: "done" }
  | { phase: "error"; message: string };

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE_MB = 20;

function getFileType(file: File): "pdf" | "image" | null {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

type Props = { restaurantId: string };

export function MenuUploader({ restaurantId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const fileType = getFileType(file);
      if (!fileType) {
        setState({ phase: "error", message: "Unsupported format. Use PDF, JPG, or PNG." });
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setState({ phase: "error", message: `File too large. Max ${MAX_SIZE_MB} MB.` });
        return;
      }

      setState({ phase: "uploading", progress: 0 });

      try {
        // 1. Upload to Supabase Storage
        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const path = `${restaurantId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-uploads")
          .upload(path, file, { upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        setState({ phase: "uploading", progress: 60 });

        // 2. Get public URL
        const { data: urlData } = supabase.storage
          .from("menu-uploads")
          .getPublicUrl(path);

        const fileUrl = urlData.publicUrl;

        setState({ phase: "uploading", progress: 80 });

        // 3. Kick off ingestion
        const res = await fetch("/api/menu/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, fileUrl, fileType }),
        });

        if (!res.ok) throw new Error("Failed to start ingestion.");

        const { jobId } = await res.json() as { jobId: string };

        setState({ phase: "processing" });

        // 4. Poll for completion
        await pollJobStatus(jobId);
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [restaurantId]
  );

  async function pollJobStatus(jobId: string) {
    const MAX_POLLS = 60; // 2 minutes at 2s interval
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`/api/menu/job/${jobId}`);
      if (!res.ok) continue;
      const data = await res.json() as { status: string; error_message: string | null };

      if (data.status === "done") {
        setState({ phase: "done" });
        setTimeout(() => router.refresh(), 1200);
        return;
      }
      if (data.status === "error") {
        setState({ phase: "error", message: data.error_message ?? "Ingestion failed." });
        return;
      }
    }
    setState({ phase: "error", message: "Timed out. Please try again." });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const isIdle = state.phase === "idle";
  const isBusy = state.phase === "uploading" || state.phase === "processing";

  return (
    <div className="mb-8">
      {state.phase === "idle" || state.phase === "error" ? (
        <>
          <div
            onClick={() => !isBusy && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
              isDragOver
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload your menu
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                PDF, JPG, or PNG — up to {MAX_SIZE_MB} MB
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <FileText className="w-3.5 h-3.5" /> PDF
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {state.phase === "error" && (
            <div className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 flex-1">{state.message}</p>
              <button
                onClick={() => setState({ phase: "idle" })}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : state.phase === "uploading" ? (
        <ProgressCard
          icon={<UploadCloud className="w-4 h-4 text-emerald-600" />}
          label="Uploading…"
          progress={state.progress}
        />
      ) : state.phase === "processing" ? (
        <ProgressCard
          icon={<Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
          label="AI is reading your menu…"
          indeterminate
        />
      ) : (
        /* done */
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700">
            Menu imported successfully — refreshing…
          </p>
        </div>
      )}
    </div>
  );
}

function ProgressCard({
  icon,
  label,
  progress,
  indeterminate,
}: {
  icon: React.ReactNode;
  label: string;
  progress?: number;
  indeterminate?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-sm font-medium text-gray-700">{label}</p>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        {indeterminate ? (
          <div className="h-full w-1/3 rounded-full bg-emerald-500 animate-[indeterminate_1.4s_ease-in-out_infinite]" />
        ) : (
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress ?? 0}%` }}
          />
        )}
      </div>
    </div>
  );
}
