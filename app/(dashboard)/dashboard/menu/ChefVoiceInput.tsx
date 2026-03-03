"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type State =
  | { status: "idle" }
  | { status: "recording"; seconds: number }
  | { status: "processing" }
  | { status: "success"; transcript: string; item_name: string; notes: string }
  | { status: "error"; message: string; transcript?: string };

export function ChefVoiceInput({ restaurantId }: { restaurantId: string }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: mimeType });
        setState({ status: "processing" });

        const formData = new FormData();
        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        formData.append("audio", blob, `voice-note.${ext}`);

        try {
          const res = await fetch("/api/menu/voice-note", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
            setState({
              status: "error",
              message: data.error ?? "Something went wrong.",
              transcript: data.transcript,
            });
          } else {
            setState({
              status: "success",
              transcript: data.transcript,
              item_name: data.item_name,
              notes: data.notes,
            });
          }
        } catch {
          setState({ status: "error", message: "Network error. Please try again." });
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      let secs = 0;
      setState({ status: "recording", seconds: 0 });
      timerRef.current = setInterval(() => {
        secs++;
        setState({ status: "recording", seconds: secs });
      }, 1000);
    } catch {
      setState({ status: "error", message: "Microphone access denied." });
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Chef's Voice Notes</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Record a voice note about any dish — say the dish name first, then describe it. The AI will transcribe and save it automatically.
        </p>
      </div>

      {/* IDLE */}
      {state.status === "idle" && (
        <div className="flex flex-col items-center py-6 gap-4">
          <button
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 flex items-center justify-center transition-colors shadow-sm"
          >
            <Mic className="w-7 h-7 text-white" />
          </button>
          <p className="text-xs text-gray-400">Tap to start recording</p>
        </div>
      )}

      {/* RECORDING */}
      {state.status === "recording" && (
        <div className="flex flex-col items-center py-6 gap-4">
          {/* Pulsing ring */}
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-25 animate-ping" />
            <button
              onClick={stopRecording}
              className="relative w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm"
            >
              <Square className="w-6 h-6 text-white fill-white" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 tabular-nums">
              {formatTime(state.seconds)}
            </span>
            <span className="text-xs text-gray-400">— Tap to stop</span>
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {state.status === "processing" && (
        <div className="flex flex-col items-center py-6 gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Transcribing and identifying dish…</p>
        </div>
      )}

      {/* SUCCESS */}
      {state.status === "success" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">
              Saved to: <span className="font-semibold">{state.item_name}</span>
            </span>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Transcript
              </p>
              <p className="text-sm text-gray-600 italic">"{state.transcript}"</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Saved notes
              </p>
              <p className="text-sm text-gray-700">{state.notes}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Record another note
          </button>
        </div>
      )}

      {/* ERROR */}
      {state.status === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{state.message}</p>
          </div>
          {state.transcript && (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Transcription received
              </p>
              <p className="text-sm text-gray-600 italic">"{state.transcript}"</p>
            </div>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
