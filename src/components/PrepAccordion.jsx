import { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";

// Local copy — converts a hex color to rgba with the given alpha.
const hexA = (hex, a) => {
  const h = (hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return `rgba(0,0,0,${a})`;
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Accessible accordion for a single interview's prep areas.
 *
 * Upgraded from hand-rolled show/hide to @radix-ui/react-accordion so that:
 *   - each trigger has aria-expanded and aria-controls set automatically
 *   - each region has role="region" and aria-labelledby
 *   - keyboard nav works: Enter/Space toggles, Arrow Down/Up moves between items
 *
 * Multiple items can be open simultaneously (type="multiple"), matching the
 * original Set-based behavior.
 */
export function PrepAccordion({ areas, ac, brd, txt, txtS, txtT, dark }) {
  // Controlled so we can apply dynamic inline styles based on open state.
  const [openItems, setOpenItems] = useState([]);
  const isOpen = (area) => openItems.includes(area);

  return (
    <Accordion.Root
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
    >
      {areas.map((pa) => {
        const open = isOpen(pa.area);
        return (
          <Accordion.Item
            key={pa.area}
            value={pa.area}
            style={{
              border: `1px solid ${open ? hexA(ac, 0.5) : brd}`,
              borderRadius: 10,
              marginBottom: 6,
              overflow: "hidden",
              transition: "border-color .15s",
            }}
          >
            {/*
             * Accordion.Header renders as <h3> (correct WAI-ARIA pattern for
             * accordions). We reset its default margin so layout matches.
             */}
            <Accordion.Header style={{ margin: 0 }}>
              <Accordion.Trigger
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 13px",
                  background: open ? hexA(ac, dark ? 0.12 : 0.06) : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: txt,
                  fontFamily: "inherit",
                  // Ensure keyboard focus is visible.
                  outline: "none",
                }}
                // Show a focus ring when navigating by keyboard.
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${hexA(ac, 0.6)}`; }}
                onBlur={(e)  => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{pa.area}</span>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 11,
                    color: open ? ac : txtT,
                    marginLeft: 8,
                    display: "inline-block",
                    transform: open ? "rotate(180deg)" : "none",
                    transition: "transform .15s",
                  }}
                >
                  ▾
                </span>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content>
              <div style={{ padding: "2px 13px 11px", borderTop: `1px solid ${brd}` }}>
                {(pa.items || []).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: txtS,
                      padding: "6px 0",
                      lineHeight: 1.6,
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: ac, flexShrink: 0 }} aria-hidden="true">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
