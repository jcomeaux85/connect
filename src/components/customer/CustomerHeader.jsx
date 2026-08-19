import React, { useRef, useState, useLayoutEffect } from "react";
import { Phone, MessageSquare, Mail, AlertCircle, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Auto-scaling name — shrinks font size to fit a fixed-width container
function AutoFitName({ text, baseSize = 30, minSize = 14, color }) {
  const ref = useRef(null);
  const [size, setSize] = useState(baseSize);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const containerWidth = el.parentElement.offsetWidth;
      let s = baseSize;
      el.style.fontSize = `${s}px`;
      while (el.scrollWidth > containerWidth && s > minSize) {
        s -= 0.5;
        el.style.fontSize = `${s}px`;
      }
      setSize(s);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text, baseSize, minSize]);

  return (
    <h1
      ref={ref}
      style={{
        fontSize: `${size}px`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        fontWeight: 700,
        lineHeight: 1.15,
        color,
      }}
    >
      {text}
    </h1>
  );
}

export default function CustomerHeader({
  customer,
  employerEntity,
  employerName,
  isPersonOfInterest,
  isEditing,
  onCall,
  onSMS,
  onEmail,
  onToggleEscalation,
  onEdit,
  colors,
  getButtonStyle,
  isLazerClient = false,
  lazerAssets = null,
}) {
  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

  const headerStyle = {
    background: isLazerClient && lazerAssets
      ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${lazerAssets.asphalt})`
      : (employerEntity?.header_bg_color || colors.bg),
    backgroundSize: isLazerClient && lazerAssets ? "cover" : undefined,
    backgroundPosition: isLazerClient && lazerAssets ? "center" : undefined,
    boxShadow: `8px 8px 1px ${colors.shadowDark}, -8px -8px 1px ${colors.shadowLight}`,
    borderRadius: "18px",
    ...(isPersonOfInterest
      ? {
          border: "1px solid rgba(245, 158, 11, 0.25)",
          boxShadow: `0 0 1px rgba(245, 158, 11, 0.05), 8px 8px 1px ${colors.shadowDark}, -8px -8px 1px ${colors.shadowLight}`,
        }
      : {}),
  };

  const isLazer = isLazerClient && lazerAssets;
  // Narrow chrome-textured buttons that pop out of the dark header.
  const btnStyle = isLazer
    ? {
        backgroundImage: `url(${lazerAssets.chrome})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 3px 1px rgba(0,0,0,0.6), 0 1px 1px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
        border: "1px solid rgba(255,255,255,0.25)",
        color: "#1a1a1a",
        textShadow: "0 1px 0 rgba(255,255,255,0.4)",
        ...(isPersonOfInterest ? { border: "1px solid rgba(245, 158, 11, 0.6)" } : {}),
      }
    : {
        ...getButtonStyle(),
        ...(isPersonOfInterest ? { border: "1px solid rgba(245, 158, 11, 0.2)" } : {}),
      };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden mb-4 p-5 flex items-stretch gap-4${isLazerClient && lazerAssets ? " lazer-header-skin" : ""}`}
      style={headerStyle}
    >
      {/* Left: Name (55% width) + job title + buttons */}
      <div className="flex flex-col justify-center" style={{ width: "55%", minWidth: 0 }}>
        <AutoFitName text={fullName} baseSize={55} minSize={22} color={colors.text} />
        <p className="text-lg mt-1 mb-3" style={{ color: colors.textSecondary }}>
          {customer.job_title || "No job title"}
          {employerName ? ` at ${employerName}` : ""}
        </p>
        <div className="flex gap-2 flex-wrap">
          {customer.primary_phone && (
            <Button
              onClick={onCall}
              className="rounded-lg h-6 px-2.5 border-0 text-xs flex items-center gap-1"
              style={btnStyle}
            >
              <Phone className="w-3 h-3" />
              Call
            </Button>
          )}
          {customer.primary_phone && (
            <Button
              onClick={onSMS}
              className="rounded-lg h-6 px-2.5 border-0 text-xs flex items-center gap-1"
              style={btnStyle}
            >
              <MessageSquare className="w-3 h-3" />
              SMS
            </Button>
          )}
          <Button
            onClick={onEmail}
            className="rounded-lg h-6 px-2.5 border-0 text-xs flex items-center gap-1"
            style={btnStyle}
          >
            <Mail className="w-3 h-3" />
            Email
          </Button>
          <Button
            onClick={onToggleEscalation}
            className="rounded-lg h-6 px-2.5 border-0 text-xs flex items-center gap-1"
            style={{
              ...btnStyle,
              background: customer.escalation_flag
                ? "linear-gradient(145deg, #fee2e2, #fecaca)"
                : colors.bg,
              color: customer.escalation_flag ? "#dc2626" : colors.textSecondary,
            }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {customer.escalation_flag ? "Remove Escalation" : "Escalate"}
          </Button>
          {!isEditing && (
            <Button
              onClick={onEdit}
              className="rounded-lg h-6 px-2.5 border-0 text-xs flex items-center gap-1"
              style={btnStyle}
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Right: Company logo at header height, right justified, alone */}
      <div className="flex-1 flex items-center justify-end" style={{ minWidth: 0 }}>
        {isLazerClient && lazerAssets && !employerEntity?.company_logo_url ? (
          <div
            style={{
              background: colors.bg,
              borderRadius: "14px",
              padding: "10px 16px",
              boxShadow: "0 4px 1px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={lazerAssets.logo}
              alt="Lazer"
              style={{
                maxHeight: 116,
                maxWidth: 340,
                objectFit: "contain",
              }}
            />
          </div>
        ) : employerEntity?.company_logo_url ? (
          <img
            src={employerEntity.company_logo_url}
            alt={employerName || "Company"}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              objectPosition: "right center",
            }}
          />
        ) : employerName ? (
          <span
            className="text-lg font-bold text-right"
            style={{ color: colors.textSecondary }}
          >
            {employerName}
          </span>
        ) : null}
      </div>
    </div>
  );
}