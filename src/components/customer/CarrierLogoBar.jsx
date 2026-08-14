import React from "react";

// Clean, containerless row of carrier logos — inspired by ndrndr.com/alera/doc.
// Logos sit in a horizontal row, washed-out at rest, full pop on hover.
// Each logo is a clickable link to the carrier's portal. No phone numbers,
// no borders, no containers — just the brand marks.
export default function CarrierLogoBar({ company, colors }) {
  if (!company) return null;

  const carriers = [
    { key: "medical",    name: company.carrier_medical_name,    logo: company.carrier_medical_logo_url },
    { key: "dental",     name: company.carrier_dental_name,     logo: company.carrier_dental_logo_url },
    { key: "vision",     name: company.carrier_vision_name,     logo: company.carrier_vision_logo_url },
    { key: "life",       name: company.carrier_life_name,       logo: company.carrier_life_logo_url },
    { key: "disability", name: company.carrier_disability_name, logo: company.carrier_disability_logo_url },
  ].filter((c) => c.name);

  if (carriers.length === 0) return null;

  // Map carriers to portal links if available
  const portalUrl = (carrier) => {
    if (carrier.key === "medical" && company.portal_link_1_url) return company.portal_link_1_url;
    if (carrier.key === "dental" && company.portal_link_2_url) return company.portal_link_2_url;
    return company.website || null;
  };

  const washedStyle = {
    filter: "grayscale(0.3) opacity(0.85)",
    transition: "filter 0.35s ease, transform 0.35s ease",
  };

  const popStyle = {
    filter: "grayscale(0) opacity(1)",
    transform: "translateY(-2px)",
  };

  return (
    <div className="flex items-center gap-8 mb-4 px-1 flex-wrap">
      {carriers.map((carrier) => {
        const url = portalUrl(carrier);
        const linkProps = url
          ? { href: url, target: "_blank", rel: "noopener noreferrer" }
          : { as: "div" };

        const Tag = url ? "a" : "div";

        return (
          <Tag
            key={carrier.key}
            {...linkProps}
            className="block flex flex-col items-center justify-center select-none"
            style={washedStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, popStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, washedStyle)}
            title={url ? `${carrier.name} — open portal` : carrier.name}
          >
            {carrier.logo ? (
              <img
                src={carrier.logo}
                alt={carrier.name}
                style={{ height: "40px", width: "auto", objectFit: "contain" }}
              />
            ) : (
              <span
                className="text-xl font-bold tracking-tight whitespace-nowrap"
                style={{ color: colors.text }}
              >
                {carrier.name}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}