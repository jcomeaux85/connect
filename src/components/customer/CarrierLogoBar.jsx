import React from "react";

// Clean, containerless row of carrier logos — inspired by ndrndr.com/alera/doc.
// Logos sit in a horizontal row, 80% saturation at rest, full saturation on hover.
// Each logo is a clickable link to the carrier's portal. No phone numbers,
// no borders, no containers — just the brand marks.
export default function CarrierLogoBar({ company, colors, isLazerClient = false, lazerLogoUrl = null }) {
  if (!company) return null;

  const carriers = [
    { key: "medical",    name: company.carrier_medical_name,    logo: company.carrier_medical_logo_url },
    { key: "dental",     name: company.carrier_dental_name,     logo: company.carrier_dental_logo_url },
    { key: "vision",     name: company.carrier_vision_name,     logo: company.carrier_vision_logo_url },
    { key: "life",       name: company.carrier_life_name,       logo: company.carrier_life_logo_url },
    { key: "disability", name: company.carrier_disability_name, logo: company.carrier_disability_logo_url },
  ]
    .filter((c) => c.name)
    // Ditch the Prudential logo per direction
    .filter((c) => !/prudential/i.test(c.name));

  if (carriers.length === 0) return null;

  // Map carriers to their per-carrier portal URL, falling back to legacy portal links
  const portalUrl = (carrier) => {
    const portalField = `carrier_${carrier.key}_portal_url`;
    if (company[portalField]) return company[portalField];
    if (carrier.key === "medical" && company.portal_link_1_url) return company.portal_link_1_url;
    if (carrier.key === "dental" && company.portal_link_2_url) return company.portal_link_2_url;
    return company.website || null;
  };

  const restStyle = {
    filter: "saturate(0.8)",
    transition: "filter 0.35s ease",
  };

  const hoverStyle = {
    filter: "saturate(1)",
  };

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {carriers.map((carrier) => {
        const url = portalUrl(carrier);
        const logoSrc = carrier.logo || (isLazerClient ? lazerLogoUrl : null);
        const linkProps = url
          ? { href: url, target: "_blank", rel: "noopener noreferrer" }
          : { as: "div" };

        const Tag = url ? "a" : "div";

        return (
          <Tag
            key={carrier.key}
            {...linkProps}
            className="flex items-center justify-center select-none"
            style={restStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, restStyle)}
            title={url ? `${carrier.name} — open portal` : carrier.name}
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={carrier.name}
                style={{ height: "22px", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <span
                className="text-sm font-bold tracking-tight whitespace-nowrap"
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