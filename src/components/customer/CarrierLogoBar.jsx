import React from "react";
import { Phone } from "lucide-react";

// Containerless row of carrier logos — washed out at rest, full pop on hover.
// Phone number under each logo is clickable. Clicking the logo opens the
// carrier's portal/site.
export default function CarrierLogoBar({ company, colors }) {
  if (!company) return null;

  const carriers = [
    { key: "medical",    name: company.carrier_medical_name,    phone: company.carrier_medical_phone,    logo: company.carrier_medical_logo_url },
    { key: "dental",     name: company.carrier_dental_name,     phone: company.carrier_dental_phone,     logo: company.carrier_dental_logo_url },
    { key: "vision",     name: company.carrier_vision_name,     phone: company.carrier_vision_phone,     logo: company.carrier_vision_logo_url },
    { key: "life",       name: company.carrier_life_name,       phone: company.carrier_life_phone,       logo: company.carrier_life_logo_url },
    { key: "disability", name: company.carrier_disability_name, phone: company.carrier_disability_phone, logo: company.carrier_disability_logo_url },
  ].filter((c) => c.name);

  if (carriers.length === 0) return null;

  const portalUrl = company.website || company.portal_link_1_url || null;

  const washedStyle = {
    filter: "grayscale(0.4) opacity(0.5)",
    transition: "filter 0.3s ease",
  };

  const popStyle = {
    filter: "grayscale(0) opacity(1)",
  };

  return (
    <div className="flex items-end gap-6 mb-4 px-2 flex-wrap">
      {carriers.map((carrier) => (
        <div key={carrier.key} className="flex flex-col items-center gap-1">
          {carrier.logo ? (
            <a
              href={portalUrl || "#"}
              target={portalUrl ? "_blank" : undefined}
              rel={portalUrl ? "noopener noreferrer" : undefined}
              className="block"
              style={washedStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, popStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, washedStyle)}
              title={`${carrier.name}${portalUrl ? " — open portal" : ""}`}
            >
              <img
                src={carrier.logo}
                alt={carrier.name}
                style={{ height: "44px", width: "auto", objectFit: "contain" }}
              />
            </a>
          ) : (
            <a
              href={portalUrl || "#"}
              target={portalUrl ? "_blank" : undefined}
              rel={portalUrl ? "noopener noreferrer" : undefined}
              className="text-sm font-semibold transition-opacity duration-300"
              style={{ color: colors.textSecondary, opacity: 0.5 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            >
              {carrier.name}
            </a>
          )}
          {carrier.phone && (
            <a
              href={`tel:${carrier.phone}`}
              className="text-xs hover:underline flex items-center gap-1"
              style={{ color: colors.textSecondary }}
            >
              <Phone className="w-3 h-3" />
              {carrier.phone}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}