import React, { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Video,
  Loader2,
  Check,
  X,
  RotateCcw,
  Camera,
} from "lucide-react";

// ── VideoRecorder: opens the webcam, records a video clip via MediaRecorder,
// uploads the blob, and returns the file_url to the parent.
export default function VideoRecorder({ onUploaded, existingUrl }) {
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(existingUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Start the camera
  const startCamera = useCallback(async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch (e) {
      setError("Could not access camera. Please grant camera permission or use a file instead.");
    }
  }, []);

  // Stop the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setCameraReady(false);
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };
    mr.start();
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((p) => p + 1);
    }, 1000);
  }, [stream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Retake
  const retake = useCallback(() => {
    setRecordedBlob(null);
    setPreviewUrl("");
    setElapsed(0);
  }, []);

  // Upload
  const handleUpload = useCallback(async () => {
    if (!recordedBlob) return;
    setUploading(true);
    setError("");
    try {
      const file = new File([recordedBlob], "recitation.webm", { type: "video/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPreviewUrl(file_url);
      onUploaded?.(file_url);
      stopCamera();
    } catch (e) {
      setError("Failed to upload recording.");
    } finally {
      setUploading(false);
    }
  }, [recordedBlob, onUploaded, stopCamera]);

  // Fallback: file upload
  const fileInputRef = useRef(null);
  const handleFileUpload = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPreviewUrl(file_url);
      setRecordedBlob(null);
      onUploaded?.(file_url);
    } catch (e) {
      setError("Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Already uploaded ──
  if (previewUrl && !recording && !cameraReady) {
    return (
      <div>
        <video src={previewUrl} controls className="w-full rounded-xl" style={{ background: "#000" }} />
        <div className="flex items-center gap-2 mt-2">
          <Check size={16} className="text-green-500" />
          <span className="text-xs text-green-600">Video recorded</span>
          <button
            onClick={() => { setPreviewUrl(""); setRecordedBlob(null); startCamera(); }}
            className="ml-auto text-xs text-blue-500 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Retake
          </button>
        </div>
      </div>
    );
  }

  // ── Recording / camera live view ──
  if (cameraReady || recording) {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ background: "#000" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full"
          style={{ transform: "scaleX(-1)" }}
        />
        {/* Recording indicator */}
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white font-mono">{fmtTime(elapsed)}</span>
          </div>
        )}
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 py-4 bg-gradient-to-t from-black/60 to-transparent">
          {!recording ? (
            <button
              onClick={startRecording}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center border-4 border-white hover:bg-red-600 transition"
              title="Start recording"
            >
              <div className="w-6 h-6 rounded-sm bg-white" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-4 border-red-500 hover:bg-gray-100 transition"
              title="Stop recording"
            >
              <div className="w-5 h-5 rounded-sm bg-red-500" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 p-3">{error}</p>}
      </div>
    );
  }

  // ── Preview after stop, before upload ──
  if (recordedBlob) {
    return (
      <div>
        <video src={previewUrl} controls className="w-full rounded-xl" style={{ background: "#000" }} />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={retake}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-gray-600"
          >
            <RotateCcw size={12} /> Retake
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="ml-auto px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {uploading ? "Uploading..." : "Use this video"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // ── Initial: record or upload ──
  return (
    <div>
      <button
        onClick={startCamera}
        disabled={uploading}
        className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition disabled:opacity-50"
      >
        {uploading ? <Loader2 size={24} className="animate-spin" /> : <Video size={24} />}
        <span className="text-xs">{uploading ? "Uploading..." : "Record with camera"}</span>
      </button>
      <div className="flex items-center my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-2 text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition disabled:opacity-50"
      >
        Upload a video file
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}