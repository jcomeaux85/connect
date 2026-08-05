import React, { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/ThemeProvider";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// ── FaceCropOverlay: draggable square the specialist moves over the ID
// to select the face region. Reports the crop coords to the parent.
function FaceCropOverlay({ imageUrl, onCropChange, cropSize = 140 }) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const handlePointerDown = useCallback((e) => {
    setDragging(true);
    const touch = e.touches ? e.touches[0] : e;
    dragStart.current = {
      mx: touch.clientX,
      my: touch.clientY,
      px: pos.x,
      py: pos.y,
    };
    e.preventDefault();
  }, [pos]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = touch.clientX - dragStart.current.mx;
    const dy = touch.clientY - dragStart.current.my;
    const newX = Math.max(0, Math.min(rect.width - cropSize, dragStart.current.px + dx));
    const newY = Math.max(0, Math.min(rect.height - cropSize, dragStart.current.py + dy));
    setPos({ x: newX, y: newY });
    onCropChange?.({ x: newX, y: newY, size: cropSize, containerW: rect.width, containerH: rect.height });
  }, [dragging, cropSize, onCropChange]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  React.useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl select-none"
      style={{ touchAction: "none" }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Government ID" className="w-full block" />
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-400">No ID uploaded</span>
        </div>
      )}
      {/* Draggable crop square */}
      <div
        onPointerDown={handlePointerDown}
        className="absolute cursor-move"
        style={{
          left: pos.x,
          top: pos.y,
          width: cropSize,
          height: cropSize,
          border: "2px solid #3b82f6",
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
          transition: dragging ? "none" : "box-shadow 0.2s",
        }}
      >
        {/* Corner handles */}
        {["nw", "ne", "sw", "se"].map((corner) => (
          <div
            key={corner}
            className="absolute w-3 h-3 border-2 border-blue-500 bg-white rounded-sm"
            style={{
              top: corner.includes("n") ? -6 : "auto",
              bottom: corner.includes("s") ? -6 : "auto",
              left: corner.includes("w") ? -6 : "auto",
              right: corner.includes("e") ? -6 : "auto",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthLinkVerification({ submission, user, onBack, onReviewed }) {
  const { colors } = useTheme();
  const [checks, setChecks] = useState([false, false, false, false]);
  const [acting, setActing] = useState(false);
  const [cropInfo, setCropInfo] = useState(null);

  const cardStyle = {
    background: colors.cardBg,
    boxShadow: `6px 6px 14px ${colors.shadowDark}, -6px -6px 14px ${colors.shadowLight}`,
    borderRadius: "18px",
  };

  const sectionLabel = {
    color: colors.textTertiary,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const allChecked = checks.every(Boolean);

  const toggleCheck = (i) => {
    setChecks((p) => p.map((c, idx) => (idx === i ? !c : c)));
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await base44.entities.AuthSubmission.update(submission.id, {
        status: "approved",
        reviewed_at: new Date().toISOString(),
        specialist_email: user?.email || "",
      });
      onReviewed?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await base44.entities.AuthSubmission.update(submission.id, {
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        specialist_email: user?.email || "",
      });
      onReviewed?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  const details = [
    { label: "Member", value: submission.member_full_name },
    { label: "DOB", value: submission.date_of_birth },
    { label: "Email", value: submission.email },
    { label: "Phone", value: submission.phone },
    { label: "Policy", value: submission.policy_id },
    { label: "Employer group", value: submission.employer_group },
    { label: "Representative", value: submission.authorized_representative },
    { label: "Relationship", value: submission.relationship },
    { label: "Scope", value: submission.scope },
    { label: "Expires", value: submission.authorization_expiration },
  ];

  const checklist = [
    "Face on ID matches face in video",
    "Name on ID matches name on form",
    "ID is not expired",
    `Member recited code ${submission.verification_code} correctly`,
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium transition"
            style={{ color: colors.textSecondary }}
          >
            <ArrowLeft size={18} />
            Queue
          </button>
          <span style={{ color: colors.textTertiary }}>›</span>
          <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {submission.member_full_name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Column 1: Recitation Video + Verification Code ── */}
        <div className="p-5" style={cardStyle}>
          <p style={sectionLabel} className="mb-3">Recitation Video</p>
          {submission.recitation_video_url ? (
            <video
              src={submission.recitation_video_url}
              controls
              className="w-full rounded-xl"
              style={{ background: "#000" }}
            />
          ) : (
            <div className="w-full aspect-video rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-sm text-gray-400">No video uploaded</span>
            </div>
          )}
          <div className="mt-4">
            <p style={sectionLabel} className="mb-2">Verification Code</p>
            <div
              className="flex items-center justify-center gap-4 py-4 rounded-xl"
              style={{
                background: colors.bg,
                boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
              }}
            >
              <span
                className="text-3xl font-bold tracking-[0.3em]"
                style={{ color: colors.textPrimary }}
              >
                {submission.verification_code?.split("").join(" ") || "— — — —"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Column 2: Government ID + Face Crop ── */}
        <div className="p-5" style={cardStyle}>
          <p style={sectionLabel} className="mb-3">Government ID</p>
          <FaceCropOverlay
            imageUrl={submission.government_id_url}
            onCropChange={setCropInfo}
          />
          <div className="mt-4">
            <p style={sectionLabel} className="mb-2">Face Crop Preview</p>
            <div className="flex items-start gap-3">
              <div
                className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2"
                style={{ borderColor: colors.border }}
              >
                {submission.government_id_url ? (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${submission.government_id_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: colors.textTertiary }}>
                Drag the square over the face on the ID. The preview shows what will be saved
                as the face crop. The full ID image is discarded after approval.
              </p>
            </div>
          </div>
        </div>

        {/* ── Column 3: Submitted Details + Verification Checklist ── */}
        <div className="p-5" style={cardStyle}>
          <p style={sectionLabel} className="mb-3">Submitted Details</p>
          <div className="flex flex-col gap-1 mb-5">
            {details.map((d) => (
              <div key={d.label} className="flex justify-between text-xs py-1.5 border-b" style={{ borderColor: colors.border }}>
                <span style={{ color: colors.textTertiary }}>{d.label}</span>
                <span className="font-medium" style={{ color: colors.textPrimary }}>
                  {d.value || "—"}
                </span>
              </div>
            ))}
          </div>

          <p style={sectionLabel} className="mb-3">Verification Checklist</p>
          <div className="flex flex-col gap-2 mb-5">
            {checklist.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="flex items-center gap-2 p-2 rounded-lg text-left text-xs transition"
                style={{
                  background: checks[i] ? "rgba(34,197,94,0.08)" : colors.bg,
                  boxShadow: `inset 1px 1px 3px ${colors.shadowDark}, inset -1px -1px 3px ${colors.shadowLight}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border"
                  style={{
                    background: checks[i] ? "#22c55e" : "transparent",
                    borderColor: checks[i] ? "#22c55e" : colors.textTertiary,
                  }}
                >
                  {checks[i] && <Check size={12} className="text-white" />}
                </div>
                <span style={{ color: colors.textSecondary }}>{item}</span>
              </button>
            ))}
          </div>

          <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>
            All four checks must be confirmed before approval.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleApprove}
              disabled={!allChecked || acting}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
              style={{
                background: "#7aaec5",
                color: "#ffffff",
                boxShadow: `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
              }}
            >
              {acting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Approve and Discard ID
            </button>
            <button
              onClick={handleReject}
              disabled={acting}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
              style={{
                background: "transparent",
                color: "#dc3545",
                border: `1px solid ${colors.border}`,
              }}
            >
              <X size={16} />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}