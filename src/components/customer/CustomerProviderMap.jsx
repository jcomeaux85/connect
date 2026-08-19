import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/ThemeProvider";
import { MapPin, Maximize2, Download, Filter, Home, Stethoscope, Eye, Smile, Heart, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Fix leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const HOME_ICON = L.divIcon({
  className: "",
  html: `<div style="width:38px;height:38px;background:#1e40af;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(30,64,175,0.5);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const FILTER_CATEGORIES = [
  { key: "medical",    label: "Medical",    color: "#ef4444", Icon: Stethoscope },
  { key: "dental",     label: "Dental",     color: "#3b82f6", Icon: Smile       },
  { key: "vision",     label: "Vision",     color: "#8b5cf6", Icon: Eye         },
  { key: "life",       label: "Life",       color: "#10b981", Icon: Heart       },
  { key: "disability", label: "Disability", color: "#f59e0b", Icon: MapPin      },
];

function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 12, { duration: 1.2 });
  }, [position, map]);
  return null;
}

async function geocodeAddress(addressStr) {
  if (!addressStr) return null;
  const encoded = encodeURIComponent(addressStr);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

export default function CustomerProviderMap({ customer, clientCompany, employer }) {
  const { colors, getButtonStyle } = useTheme();
  const [homeCoords, setHomeCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(["medical", "dental", "vision", "life", "disability"]));
  const [showFilters, setShowFilters] = useState(false);

  const address = [customer?.address_street, customer?.address_city, customer?.address_state, customer?.address_zip]
    .filter(Boolean).join(", ");

  useEffect(() => {
    if (!address) return;
    setGeocoding(true);
    setGeocodeError(false);
    geocodeAddress(address)
      .then((coords) => { if (coords) setHomeCoords(coords); else setGeocodeError(true); })
      .catch(() => setGeocodeError(true))
      .finally(() => setGeocoding(false));
  }, [address]);

  const toggleFilter = useCallback((key) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    import("html2canvas").then(({ default: html2canvas }) => {
      const mapEl = document.getElementById("customer-map-container");
      if (!mapEl) return;
      html2canvas(mapEl, { useCORS: true }).then((canvas) => {
        const link = document.createElement("a");
        link.download = `${customer?.first_name || "customer"}_${customer?.last_name || "map"}_map.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });
  }, [customer]);

  const defaultCenter = homeCoords ? [homeCoords.lat, homeCoords.lng] : [39.5, -98.35];
  const defaultZoom = homeCoords ? 12 : 4;

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <>
      {/* ─── Collapsed bar — full width, click to expand ─── */}
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between px-5 py-3 rounded-2xl border-0 transition-all hover:opacity-90 relative overflow-hidden"
        style={{
          background: colors.bg,
          boxShadow: `6px 6px 1px ${colors.shadowDark}, -6px -6px 1px ${colors.shadowLight}`,
        }}
      >
        {/* Isometric map background — centered horizontally, slightly below center vertically.
            Side scrims keep both the left label and the right hint legible over the image. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/f8cd8f7e4_4QQ5p.jpg')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
        {/* Left scrim for the label, right scrim for the hint */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-40 pointer-events-none" style={{ background: `linear-gradient(to right, ${colors.bg}f4, transparent)` }} />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-40 pointer-events-none" style={{ background: `linear-gradient(to left, ${colors.bg}f4, transparent)` }} />

        <div className="relative flex items-center gap-2.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 1px rgba(0,0,0,0.4)" }}>
          <MapPin className="w-4 h-4" style={{ color: "#3b82f6", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
          <span className="font-semibold text-sm" style={{ color: "#ffffff" }}>Provider Map</span>
          {geocoding && <span className="text-xs animate-pulse" style={{ color: "#e5e7eb" }}>Locating…</span>}
          {homeCoords && !geocoding && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dbeafe", color: "#1e40af" }}>
              <Home className="w-3 h-3 inline mr-1" />Plotted
            </span>
          )}
          {geocodeError && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fee2e2", color: "#991b1b" }}>
              Address not found
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-1.5 text-xs font-medium" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 1px rgba(0,0,0,0.4)" }}>
          <span>Click to expand</span>
          <Maximize2 className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
        </div>
      </button>

      {/* ─── Expanded overlay — full screen, click outside to close ─── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-7xl flex flex-col rounded-3xl overflow-hidden"
              style={{
                background: colors.bg,
                boxShadow: `20px 20px 60px rgba(0,0,0,0.4)`,
                height: "85vh",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border || "#e5e7eb"}` }}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: "#3b82f6" }} />
                  <span className="font-semibold text-sm" style={{ color: colors.text }}>Provider Map</span>
                  {geocoding && <span className="text-xs animate-pulse" style={{ color: colors.textSecondary }}>Locating…</span>}
                  {homeCoords && !geocoding && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#dbeafe", color: "#1e40af" }}>
                      <Home className="w-3 h-3 inline mr-1" />Plotted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowFilters((p) => !p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium" style={{ ...getButtonStyle(), color: showFilters ? "#8b5cf6" : colors.textSecondary }}>
                    <Filter className="w-3.5 h-3.5" /> Filter
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium" style={{ ...getButtonStyle(), color: "#10b981" }} title="Export PNG">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setExpanded(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium" style={{ ...getButtonStyle(), color: "#ef4444" }}>
                    <X className="w-3.5 h-3.5" />
                    Hide
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              {showFilters && (
                <div className="flex flex-wrap gap-2 px-5 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border || "#e5e7eb"}` }}>
                  {FILTER_CATEGORIES.map(({ key, label, color, Icon }) => {
                    const active = activeFilters.has(key);
                    const carrier = employer?.[`map_${key}_carrier`];
                    const group = employer?.[`map_${key}_group`];
                    return (
                      <button key={key} onClick={() => toggleFilter(key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                        style={{ borderColor: active ? color : "transparent", background: active ? `${color}18` : (colors.cardBg || "#f9fafb"), color: active ? color : colors.textSecondary }}>
                        <Icon className="w-3 h-3" />
                        <span>{label}</span>
                        {carrier && <span className="opacity-70 font-normal">· {carrier}{group ? ` (${group})` : ""}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Map — fills remaining space proportionally */}
              <div id="customer-map-container" className="flex-1 min-h-0 relative">
                {!address && !geocoding ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2" style={{ background: colors.cardBg || "#f9fafb" }}>
                    <MapPin className="w-10 h-10" style={{ color: colors.textTertiary || "#9ca3af" }} />
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No address on file</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Add an address to plot on map</p>
                  </div>
                ) : geocodeError ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2" style={{ background: colors.cardBg || "#f9fafb" }}>
                    <MapPin className="w-10 h-10 text-red-400" />
                    <p className="text-sm font-medium text-red-500">Could not geocode address</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{address}</p>
                  </div>
                ) : (
                  <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {homeCoords && <MapFlyTo position={[homeCoords.lat, homeCoords.lng]} />}
                    {homeCoords && (
                      <Marker position={[homeCoords.lat, homeCoords.lng]} icon={HOME_ICON}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold text-blue-700 mb-1">🏠 {customer?.first_name} {customer?.last_name}</p>
                            <p className="text-gray-600 text-xs">{address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-2 text-xs flex-shrink-0" style={{ borderTop: `1px solid ${colors.border || "#e5e7eb"}`, color: colors.textSecondary }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-700 border border-white shadow-sm" />
                  <span>Home</span>
                </div>
                {FILTER_CATEGORIES.filter((c) => activeFilters.has(c.key)).map(({ key, label, color }) => {
                  const carrier = employer?.[`map_${key}_carrier`];
                  const group = employer?.[`map_${key}_group`];
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: color }} />
                      <span>{label}{carrier ? `: ${carrier}` : ""}{group ? ` · ${group}` : ""}</span>
                    </div>
                  );
                })}
                <span className="ml-auto opacity-60">OpenStreetMap</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}