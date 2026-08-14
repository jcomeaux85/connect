import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VideoRecorder from "@/components/authlink/VideoRecorder";
import {
  Lock,
  Loader2,
  Check,
  Video,
  CreditCard,
  Upload,
  ChevronRight,
  KeyRound,
} from "lucide-react";

const STEPS = ["gate", "intro", "video", "id", "recite", "done"];

export default function AuthLinkMember() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("gate");
  const [videoUrl, setVideoUrl] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [recitedCode, setRecitedCode] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Load submission
  React.useEffect(() => {
    if (!id) return;
    base44.entities.AuthSubmission.get(id)
      .then((data) => {
        setSubmission(data);
        setVideoUrl(data.recitation_video_url || "");
        setIdUrl(data.government_id_url || "");
        // If already submitted/approved/rejected/cancelled, skip gate
        if (data.status && data.status !== "link_generated") {
          setStep("done");
        }
      })
      .catch(() => setError("Invalid or expired authorization link."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGateSubmit = () => {
    setGateError("");
    if (gateCode === submission?.verification_code) {
      setStep("intro");
    } else {
      setGateError("Incorrect code. Please contact your specialist for your 5-digit access code.");
    }
  };

  const handleUploadId = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setIdUrl(file_url);
    } catch (e) {
      setError("Failed to upload ID.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.AuthSubmission.update(id, {
        recitation_video_url: videoUrl,
        government_id_url: idUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      setStep("done");
    } catch (e) {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <Lock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── Done screen ──
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Authorization Submitted</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your authorization has been submitted for review. A specialist will verify your
            information shortly. You may close this window.
          </p>
          <div className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Lock size={12} />
            AUTH|link — Secure Authorization
          </div>
        </div>
      </div>
    );
  }

  // ── Step indicator (hide on gate) ──
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Lock size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">
              AUTH<span className="text-blue-500">|</span>link
            </span>
          </div>
          <span className="text-xs text-gray-400">Member Portal</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-4">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* ── Code gate step ── */}
          {step === "gate" && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <KeyRound size={28} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Enter your access code
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Your specialist gave you a 5-digit code to open this session. Enter it below to
                begin.
              </p>
              <input
                type="text"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={(e) => e.key === "Enter" && gateCode.length === 5 && handleGateSubmit()}
                placeholder="• • • • •"
                inputMode="numeric"
                autoFocus
                className="w-full px-4 py-4 rounded-xl border border-gray-300 text-center text-2xl font-bold tracking-[0.4em] text-gray-900 outline-none focus:border-blue-500 mb-4"
              />
              {gateError && <p className="text-xs text-red-500 mb-3">{gateError}</p>}
              <button
                onClick={handleGateSubmit}
                disabled={gateCode.length !== 5}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition disabled:opacity-40"
              >
                Unlock
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Intro step ── */}
          {step === "intro" && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Hi {submission?.member_full_name?.split(" ")[0] || "there"},
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                You've been asked to authorize{" "}
                <span className="font-semibold text-gray-700">
                  {submission?.authorized_representative}
                </span>{" "}
                ({submission?.relationship}) to speak on your behalf regarding policy{" "}
                <span className="font-semibold text-gray-700">{submission?.policy_id}</span>.
              </p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-blue-900 mb-1">What you'll need:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• A device with a camera (phone or computer)</li>
                  <li>• Your government-issued photo ID</li>
                  <li>• Your 5-digit access code (to recite on camera)</li>
                  <li>• About 3 minutes of your time</li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Scope: {submission?.scope} · Expires: {submission?.authorization_expiration}
              </p>
              <button
                onClick={() => setStep("video")}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition"
              >
                Get Started
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Video step ── */}
          {step === "video" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Video size={20} className="text-blue-500" />
                <h1 className="text-lg font-bold text-gray-900">Record your video</h1>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Please record a short video of yourself. In the next step, you'll be shown your
                5-digit code to recite on camera.
              </p>
              <div className="mb-4">
                <VideoRecorder
                  existingUrl={videoUrl}
                  onUploaded={(url) => setVideoUrl(url)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("intro")}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("id")}
                  disabled={!videoUrl}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── ID upload step ── */}
          {step === "id" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-blue-500" />
                <h1 className="text-lg font-bold text-gray-900">Upload your ID</h1>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Please upload a clear photo of your government-issued ID (driver's license,
                state ID, or passport). The specialist will use this to verify your identity.
              </p>
              {idUrl ? (
                <div className="mb-4">
                  <img src={idUrl} alt="Your ID" className="w-full rounded-xl" />
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <Check size={16} />
                    <span className="text-xs">ID uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadId(f);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Upload size={24} />
                    )}
                    <span className="text-xs">
                      {uploading ? "Uploading..." : "Take or upload photo"}
                    </span>
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("video")}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("recite")}
                  disabled={!idUrl}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Recite code step ── */}
          {step === "recite" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-blue-500" />
                <h1 className="text-lg font-bold text-gray-900">Recite your verification code</h1>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Please record yourself saying this 5-digit code out loud in your video. This
                proves you are the person in the video.
              </p>
              <div className="bg-gray-900 rounded-xl py-8 mb-4 text-center">
                <span className="text-4xl font-bold tracking-[0.3em] text-white">
                  {submission?.verification_code}
                </span>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700">
                  If you haven't already, go back and re-record your video including this code.
                  Then confirm below to submit.
                </p>
              </div>
              <p className="text-xs text-gray-400 mb-2">Confirm the code you recited:</p>
              <input
                type="text"
                value={recitedCode}
                onChange={(e) => setRecitedCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="Enter 5-digit code"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg font-bold tracking-[0.3em] text-gray-900 outline-none focus:border-blue-500 mb-4"
              />
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("id")}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={recitedCode !== submission?.verification_code || submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-3 text-center">
        <span className="text-xs text-gray-400 inline-flex items-center gap-1">
          <Lock size={12} />
          AUTH|link — Secure Authorization · BEN|connect™
        </span>
      </div>
    </div>
  );
}