"use client";

import { useState, useEffect, useCallback } from "react";
import { Fingerprint, Save, ChevronDown, ChevronUp, Edit2, ExternalLink, Calendar, Clock, MapPin, Sparkles, Loader2, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BirthData {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  city: string;   // "Los Angeles, CA, USA"
}

interface GeneKeysProfile {
  lifeWork: string;       // Activation Sequence — 1st key
  evolution: string;      // Activation Sequence — 2nd key
  radiance: string;       // Activation Sequence — 3rd key
  purpose: string;        // Activation Sequence — 4th key
  attraction: string;     // Venus Sequence — core
  iq: string;             // Venus Sequence — IQ
  eq: string;             // Venus Sequence — EQ
  sq: string;             // Venus Sequence — SQ
  vocation: string;       // Pearl Sequence — vocation
  culture: string;        // Pearl Sequence — culture
  brand: string;          // Pearl Sequence — brand
  notes: string;
}

interface HumanDesignProfile {
  type: string;
  authority: string;
  profile: string;
  strategy: string;
  definedCenters: string;
  channels: string;
  gates: string;
  notes: string;
}

interface AstrologyProfile {
  sun: string;
  moon: string;
  rising: string;
  mercury: string;
  venus: string;
  mars: string;
  jupiter: string;
  saturn: string;
  northNode: string;
  notes: string;
}

interface Blueprint {
  birthData: BirthData;
  geneKeys: GeneKeysProfile;
  humanDesign: HumanDesignProfile;
  astrology: AstrologyProfile;
}

const STORAGE_KEY = "jmc_blueprint_v1";

const EMPTY_BLUEPRINT: Blueprint = {
  birthData: { date: "", time: "", city: "" },
  geneKeys: { lifeWork: "", evolution: "", radiance: "", purpose: "", attraction: "", iq: "", eq: "", sq: "", vocation: "", culture: "", brand: "", notes: "" },
  humanDesign: { type: "", authority: "", profile: "", strategy: "", definedCenters: "", channels: "", gates: "", notes: "" },
  astrology: { sun: "", moon: "", rising: "", mercury: "", venus: "", mars: "", jupiter: "", saturn: "", northNode: "", notes: "" },
};

// ─── Human Design type descriptions ──────────────────────────────────────────
const HD_TYPES: Record<string, { strategy: string; authority_hint: string; theme: string; not_self: string; signature: string; description: string }> = {
  "Generator": {
    strategy: "Wait to Respond",
    authority_hint: "Sacral / Emotional",
    theme: "Satisfaction",
    not_self: "Frustration",
    signature: "Satisfaction",
    description: "Generators are the life-force of the planet — pure creative energy designed to respond to what arises rather than initiate. When a Generator waits to respond and follows their sacral yes, they build mastery and deep satisfaction. Their energy is sustainable and magnetic when they are lit up by what they are doing.",
  },
  "Manifesting Generator": {
    strategy: "Wait to Respond, then Inform",
    authority_hint: "Sacral / Emotional",
    theme: "Satisfaction & Peace",
    not_self: "Frustration & Anger",
    signature: "Satisfaction",
    description: "Manifesting Generators are multi-passionate, fast-moving, and built to skip steps. They respond first (like a Generator) then inform those around them before acting. They are not here to follow the straight path — their skipping is not inefficiency, it's design. When aligned, their pace and variety is a gift, not a problem.",
  },
  "Projector": {
    strategy: "Wait for the Invitation",
    authority_hint: "Splenic / Emotional / Mental / Self-Projected / Ego / None",
    theme: "Success",
    not_self: "Bitterness",
    signature: "Success",
    description: "Projectors are the guides and natural leaders of the new paradigm. They are here to see others deeply and direct energy — not to generate it themselves. When a Projector waits for the genuine recognition and invitation before sharing their wisdom, they are met with appreciation rather than resistance. They are here to work smarter, not harder.",
  },
  "Manifestor": {
    strategy: "Inform before Acting",
    authority_hint: "Emotional / Splenic / Ego",
    theme: "Peace",
    not_self: "Anger",
    signature: "Peace",
    description: "Manifestors are the initiators — the only type designed to act without waiting for a response or invitation. Their power is in their ability to make things happen, to begin. The key is informing those who will be affected by their actions before moving. When Manifestors inform, they reduce resistance and create peace — for themselves and those around them.",
  },
  "Reflector": {
    strategy: "Wait a Lunar Cycle",
    authority_hint: "Lunar",
    theme: "Delight",
    not_self: "Disappointment",
    signature: "Delight",
    description: "Reflectors are the rarest type — entirely open, reflecting and amplifying the energy of everyone around them. They are here to be a mirror for the community, showing people how they are doing. Reflectors need to wait a full lunar cycle (28 days) before making major decisions, using the moon's movement through all 64 gates to achieve clarity.",
  },
};

// ─── Gene Key position descriptions ──────────────────────────────────────────
const GK_POSITIONS = {
  lifeWork: { label: "Life's Work", sequence: "Activation Sequence", description: "Your core gift and what you are here to embody and express in your life's work — the Gift you are mastering." },
  evolution: { label: "Evolution", sequence: "Activation Sequence", description: "The inner gift that catalyzes your personal growth — the shadow to transform and the quality you are evolving through." },
  radiance: { label: "Radiance", sequence: "Activation Sequence", description: "The quality that radiates out from you naturally when you are living at your Gift frequency — your energetic signature." },
  purpose: { label: "Purpose", sequence: "Activation Sequence", description: "The deepest frequency of your Activation Sequence — your core spiritual purpose and the seed of your highest potential." },
  attraction: { label: "Attraction", sequence: "Venus Sequence", description: "The key that magnetizes your relationships — the quality in you that draws others in and the shadow that can repel." },
  iq: { label: "IQ", sequence: "Venus Sequence", description: "Your mental gift in relationship — how you think and communicate in partnership, and the intellectual patterns to transcend." },
  eq: { label: "EQ", sequence: "Venus Sequence", description: "Your emotional gift in relationship — the depth of feeling you bring and the emotional patterns that shape your partnerships." },
  sq: { label: "SQ", sequence: "Venus Sequence", description: "Your spiritual gift in relationship — the transcendent quality you are here to embody in your most intimate connections." },
  vocation: { label: "Vocation", sequence: "Pearl Sequence", description: "Your natural vocation and the gift you are bringing to the world through your work — your core offering." },
  culture: { label: "Culture", sequence: "Pearl Sequence", description: "The environment and collective you are here to influence — the culture you naturally create around you." },
  brand: { label: "Brand", sequence: "Pearl Sequence", description: "The unique frequency of your brand and how your gifts are recognized in the marketplace — your signature energy." },
};

// ─── Calculator guide data ────────────────────────────────────────────────────
const CALC_GUIDES = {
  genekeys: {
    title: "Find Your Gene Keys Profile",
    url: "https://genekeys.com/profile-finder/",
    urlLabel: "genekeys.com/profile-finder",
    note: "A free account is required. Your profile is generated from your birth date (and optionally birth time).",
    steps: [
      "Create a free account at genekeys.com",
      "Go to My Profile and enter your birth date",
      "Open your Hologenetic Profile page",
      "Copy the gate number shown for each position into the fields below",
    ],
    fieldMap: [
      { field: "Life's Work (Activation)", from: "Activation Sequence — 1st key (Conscious Sun)" },
      { field: "Evolution (Activation)", from: "Activation Sequence — 2nd key (Conscious Earth)" },
      { field: "Radiance (Activation)", from: "Activation Sequence — 3rd key" },
      { field: "Purpose (Activation)", from: "Activation Sequence — 4th key (Unconscious Sun)" },
      { field: "Attraction, IQ, EQ, SQ (Venus)", from: "Venus Sequence — 4 keys shown in order" },
      { field: "Vocation, Culture, Brand (Pearl)", from: "Pearl Sequence — 3 keys shown in order" },
    ],
  },
  humandesign: {
    title: "Get Your Human Design Chart",
    url: "https://www.mybodygraph.com/",
    urlLabel: "mybodygraph.com",
    note: "Free — no account needed. Requires your exact birth time and city for an accurate chart.",
    steps: [
      "Go to mybodygraph.com",
      "Enter your birth date, time (to the minute), and city",
      "Your BodyGraph generates instantly",
      "Copy your results into the fields below",
    ],
    fieldMap: [
      { field: "Type", from: "Shown at the top — e.g. Generator, Projector, Manifestor" },
      { field: "Profile", from: "Next to your Type — e.g. 3/5, 1/3, 6/2" },
      { field: "Authority", from: "Listed in chart summary — e.g. Sacral, Emotional, Splenic" },
      { field: "Strategy", from: "Listed with your Type — or auto-filled when you pick a Type above" },
      { field: "Defined Centers", from: "The colored (non-white) shapes in your BodyGraph" },
      { field: "Channels & Gates", from: "Lines connecting centers (channels) and their gate numbers" },
    ],
  },
  astrology: {
    title: "Get Your Birth Chart",
    url: "https://www.astro.com/cgi/chart.cgi",
    urlLabel: "astro.com free chart",
    note: "The most trusted free natal chart online. Exact birth time and city are needed for your Rising sign.",
    steps: [
      "Go to astro.com and choose Free Horoscopes → Extended Chart Selection",
      "Enter your birth date, exact time, and city",
      "Your natal chart and planet table generate",
      "Copy each planet's sign (and house) into the fields below",
    ],
    fieldMap: [
      { field: "Sun", from: "Listed first — your zodiac sign is your Sun sign" },
      { field: "Moon", from: "Requires birth time for accuracy" },
      { field: "Rising / Ascendant", from: "Requires exact time and city — shown in the Ascendant row" },
      { field: "Mercury, Venus, Mars…", from: "Planet table below the chart — sign + house for each" },
      { field: "North Node", from: "Listed as 'Node' or 'True Node' in the planet table" },
    ],
  },
} as const;

type CalcKey = keyof typeof CALC_GUIDES;

function CalculatorGuide({ system, hasData }: { system: CalcKey; hasData: boolean }) {
  const [open, setOpen] = useState(!hasData);
  const g = CALC_GUIDES[system];
  const accentColor = system === "genekeys" ? "rgba(194,159,96,0.7)" : system === "humandesign" ? "rgba(0,200,240,0.7)" : "rgba(180,140,255,0.7)";
  const accentBg = system === "genekeys" ? "rgba(194,159,96,0.06)" : system === "humandesign" ? "rgba(0,200,240,0.06)" : "rgba(180,140,255,0.06)";

  return (
    <div style={{
      marginBottom: 22,
      borderRadius: 10,
      background: accentBg,
      borderTop: `1px solid ${accentColor.replace("0.7", "0.25")}`,
      borderLeft: `2px solid ${accentColor.replace("0.7", "0.4")}`,
      borderRight: "1px solid rgba(0,0,0,0.12)",
      borderBottom: "1px solid rgba(0,0,0,0.2)",
      overflow: "hidden",
    }}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ExternalLink size={12} color={accentColor.replace("0.7", "0.9")} />
          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accentColor.replace("0.7", "0.9") }}>
            {g.title}
          </span>
        </div>
        {open ? <ChevronUp size={13} color={accentColor.replace("0.7","0.5")} /> : <ChevronDown size={13} color={accentColor.replace("0.7","0.5")} />}
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Link */}
          <a
            href={g.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 6, marginBottom: 14,
              background: accentColor.replace("0.7", "0.12"),
              border: `1px solid ${accentColor.replace("0.7", "0.3")}`,
              textDecoration: "none",
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
              color: accentColor.replace("0.7", "0.95"),
              letterSpacing: "0.06em",
            }}
          >
            <ExternalLink size={10} /> {g.urlLabel}
          </a>

          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11.5, color: "rgba(222,211,200,0.65)", lineHeight: 1.65, margin: "0 0 12px" }}>
            {g.note}
          </p>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {g.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, color: accentColor.replace("0.7", "0.6"), flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 11.5, color: "rgba(222,211,200,0.7)", lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Field map */}
          <div style={{ borderTop: `1px solid ${accentColor.replace("0.7", "0.12")}`, paddingTop: 12 }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accentColor.replace("0.7", "0.5"), marginBottom: 8 }}>
              Where to find each field
            </div>
            {g.fieldMap.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, color: "rgba(222,211,200,0.75)", flexShrink: 0, minWidth: 140 }}>{row.field}</span>
                <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10.5, color: "rgba(222,211,200,0.45)", lineHeight: 1.5 }}>{row.from}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Birth Data Panel ─────────────────────────────────────────────────────────
function BirthDataPanel({ data, editing, onChange }: { data: BirthData; editing: boolean; onChange: (d: BirthData) => void }) {
  const set = (key: keyof BirthData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [key]: e.target.value });

  const hasBirthData = data.date || data.time || data.city;

  const panelBase: React.CSSProperties = {
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 28,
    background: "linear-gradient(160deg, rgba(194,159,96,0.07) 0%, rgba(2,12,30,0.45) 100%)",
    borderTop: "1px solid rgba(194,159,96,0.25)",
    borderLeft: "2px solid rgba(194,159,96,0.35)",
    borderRight: "1px solid rgba(0,0,0,0.15)",
    borderBottom: "1px solid rgba(0,0,0,0.25)",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
  };

  if (!editing) {
    return (
      <div style={panelBase}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hasBirthData ? 12 : 4 }}>
          <Calendar size={10} color="rgba(194,159,96,0.7)" />
          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)" }}>
            Birth Data
          </span>
        </div>
        {hasBirthData ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {data.date && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={11} color="rgba(194,159,96,0.45)" />
                <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, color: "rgba(222,211,200,0.82)" }}>
                  {new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {data.time && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={11} color="rgba(194,159,96,0.45)" />
                <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, color: "rgba(222,211,200,0.82)" }}>{data.time}</span>
              </div>
            )}
            {data.city && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={11} color="rgba(194,159,96,0.45)" />
                <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, color: "rgba(222,211,200,0.82)" }}>{data.city}</span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.35)", margin: 0 }}>
            Add your birth date, time, and city — you&rsquo;ll need these for all three calculators.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={panelBase}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Calendar size={10} color="rgba(194,159,96,0.7)" />
        <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)" }}>
          Birth Data
        </span>
        <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10.5, color: "rgba(222,211,200,0.35)", marginLeft: 4 }}>
          used by all three calculators below
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10 }}>
        <div>
          <FieldLabel>Date of Birth</FieldLabel>
          <input
            type="date"
            value={data.date}
            onChange={set("date")}
            style={{ ...inputStyle, colorScheme: "dark" }}
          />
        </div>
        <div>
          <FieldLabel hint="as accurate as possible">Birth Time</FieldLabel>
          <input
            type="time"
            value={data.time}
            onChange={set("time")}
            style={{ ...inputStyle, colorScheme: "dark" }}
          />
        </div>
        <div>
          <FieldLabel hint="city, state/country">Birth City</FieldLabel>
          <input
            type="text"
            value={data.city}
            onChange={set("city")}
            placeholder="e.g. Los Angeles, CA, USA"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Styling helpers ──────────────────────────────────────────────────────────
const TABS = [
  { id: "genekeys", label: "Gene Keys", color: "rgba(194,159,96,0.7)" },
  { id: "humandesign", label: "Human Design", color: "rgba(0,200,240,0.7)" },
  { id: "astrology", label: "Astrology", color: "rgba(180,140,255,0.7)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(2,12,30,0.55)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderTop: "1px solid rgba(0,0,0,0.3)", borderRadius: 7,
  padding: "10px 14px", color: "#DED3C8",
  fontFamily: "Syne, system-ui, sans-serif", fontSize: 13,
  outline: "none", boxSizing: "border-box" as const,
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
};

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)" }}>
        {children}
      </span>
      {hint && <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10.5, color: "rgba(222,211,200,0.38)", marginLeft: 6 }}>{hint}</span>}
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color, marginBottom: 14, marginTop: 4, paddingBottom: 8, borderBottom: `1px solid ${color.replace("0.7", "0.15")}` }}>
      {label}
    </div>
  );
}

// ─── Gene Keys Tab ────────────────────────────────────────────────────────────
function GeneKeysTab({ data, editing, onChange }: { data: GeneKeysProfile; editing: boolean; onChange: (d: GeneKeysProfile) => void }) {
  const set = (key: keyof GeneKeysProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [key]: e.target.value });

  if (!editing) {
    const hasData = Object.values(data).some(v => v.trim());
    if (!hasData) return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(222,211,200,0.35)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13 }}>
        No Gene Keys profile entered yet.
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {(["Activation Sequence", "Venus Sequence", "Pearl Sequence"] as const).map(seq => {
          const positions = Object.entries(GK_POSITIONS).filter(([, v]) => v.sequence === seq) as [keyof typeof GK_POSITIONS, typeof GK_POSITIONS[keyof typeof GK_POSITIONS]][];
          const color = seq === "Activation Sequence" ? "rgba(194,159,96,0.7)" : seq === "Venus Sequence" ? "rgba(255,140,180,0.7)" : "rgba(100,200,140,0.7)";
          return (
            <div key={seq}>
              <SectionHeader label={seq} color={color} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {positions.map(([key, pos]) => {
                  const val = data[key as keyof GeneKeysProfile];
                  if (!val) return null;
                  return (
                    <div key={key} style={{ background: "rgba(2,12,30,0.4)", borderRadius: 8, padding: "14px 16px", borderTop: `1px solid ${color.replace("0.7", "0.15")}`, borderLeft: `2px solid ${color.replace("0.7", "0.3")}`, borderRight: "1px solid rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(0,0,0,0.25)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)" }}>
                      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color, marginBottom: 4 }}>{pos.label}</div>
                      <div style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", marginBottom: 6 }}>Gene Key {val}</div>
                      <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(222,211,200,0.5)", lineHeight: 1.6, margin: 0 }}>{pos.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {data.notes && (
          <div style={{ background: "rgba(194,159,96,0.05)", borderRadius: 8, padding: "14px 16px", borderLeft: "2px solid rgba(194,159,96,0.25)", borderTop: "1px solid rgba(194,159,96,0.12)" }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.55)", marginBottom: 6 }}>Notes & Contemplations</div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.7)", lineHeight: 1.75, margin: 0 }}>{data.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <CalculatorGuide system="genekeys" hasData={Object.values(data).some(v => v.trim())} />
      <SectionHeader label="Activation Sequence — Self & Purpose" color="rgba(194,159,96,0.7)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {(["lifeWork", "evolution", "radiance", "purpose"] as const).map(key => (
          <div key={key}>
            <FieldLabel hint={GK_POSITIONS[key].description.slice(0, 50) + "…"}>{GK_POSITIONS[key].label} — Key #</FieldLabel>
            <input style={inputStyle} value={data[key]} onChange={set(key)} placeholder="e.g. 35" />
          </div>
        ))}
      </div>

      <SectionHeader label="Venus Sequence — Partnership & Relationships" color="rgba(255,140,180,0.7)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {(["attraction", "iq", "eq", "sq"] as const).map(key => (
          <div key={key}>
            <FieldLabel>{GK_POSITIONS[key].label} — Key #</FieldLabel>
            <input style={inputStyle} value={data[key]} onChange={set(key)} placeholder="e.g. 12" />
          </div>
        ))}
      </div>

      <SectionHeader label="Pearl Sequence — Business & Abundance" color="rgba(100,200,140,0.7)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {(["vocation", "culture", "brand"] as const).map(key => (
          <div key={key}>
            <FieldLabel>{GK_POSITIONS[key].label} — Key #</FieldLabel>
            <input style={inputStyle} value={data[key]} onChange={set(key)} placeholder="e.g. 8" />
          </div>
        ))}
      </div>

      <div>
        <FieldLabel>Contemplation Notes</FieldLabel>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={data.notes} onChange={set("notes")} placeholder="Personal reflections, patterns you've noticed, insights from contemplation…" />
      </div>
    </div>
  );
}

// ─── Human Design Tab ─────────────────────────────────────────────────────────
function HumanDesignTab({ data, editing, onChange }: { data: HumanDesignProfile; editing: boolean; onChange: (d: HumanDesignProfile) => void }) {
  const set = (key: keyof HumanDesignProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...data, [key]: e.target.value });
  const [expandDesc, setExpandDesc] = useState(false);

  const typeInfo = HD_TYPES[data.type] ?? null;

  if (!editing) {
    const hasData = Object.values(data).some(v => v.trim());
    if (!hasData) return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(222,211,200,0.35)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13 }}>
        No Human Design profile entered yet.
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Type card */}
        <div style={{ background: "rgba(0,180,220,0.08)", borderRadius: 10, borderTop: "1px solid rgba(0,200,240,0.2)", borderLeft: "2px solid rgba(0,200,240,0.35)", borderRight: "1px solid rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(0,0,0,0.25)", padding: "20px 22px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)" }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(0,200,240,0.6)", marginBottom: 6 }}>Type · Strategy · Authority</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: typeInfo ? 12 : 0 }}>
            <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: 26, fontWeight: 600, color: "#DED3C8" }}>{data.type}</span>
            {data.profile && <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 13, color: "rgba(0,200,240,0.7)", fontWeight: 700 }}>Profile {data.profile}</span>}
          </div>
          {data.strategy && <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.6)", marginBottom: 4 }}>Strategy: <strong style={{ color: "rgba(222,211,200,0.85)", fontStyle: "normal" }}>{data.strategy}</strong></div>}
          {data.authority && <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.6)" }}>Authority: <strong style={{ color: "rgba(222,211,200,0.85)", fontStyle: "normal" }}>{data.authority}</strong></div>}
          {typeInfo && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {[{ label: "Signature", val: typeInfo.signature, color: "rgba(100,220,160,0.7)" }, { label: "Not-Self Theme", val: typeInfo.not_self, color: "rgba(255,100,100,0.6)" }].map(b => (
                  <div key={b.label} style={{ padding: "5px 12px", borderRadius: 12, background: `${b.color.replace("0.7", "0.1").replace("0.6", "0.08")}`, border: `1px solid ${b.color.replace("0.7", "0.25").replace("0.6", "0.2")}`, fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <span style={{ color: b.color }}>{b.label}: </span>
                    <span style={{ color: "rgba(222,211,200,0.75)" }}>{b.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setExpandDesc(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,200,240,0.5)" }}>About this type</span>
                {expandDesc ? <ChevronUp style={{ width: 11, height: 11, color: "rgba(0,200,240,0.4)" }} /> : <ChevronDown style={{ width: 11, height: 11, color: "rgba(0,200,240,0.4)" }} />}
              </button>
              {expandDesc && <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.7)", lineHeight: 1.8, margin: "10px 0 0" }}>{typeInfo.description}</p>}
            </div>
          )}
        </div>

        {/* Centers / Channels / Gates */}
        {[{ label: "Defined Centers", val: data.definedCenters }, { label: "Channels", val: data.channels }, { label: "Gates", val: data.gates }].filter(r => r.val).map(row => (
          <div key={row.label} style={{ background: "rgba(2,12,30,0.4)", borderRadius: 8, padding: "14px 16px", borderTop: "1px solid rgba(0,200,240,0.1)", borderLeft: "2px solid rgba(0,200,240,0.2)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,200,240,0.55)", marginBottom: 6 }}>{row.label}</div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontSize: 13, color: "rgba(222,211,200,0.8)", lineHeight: 1.7, margin: 0 }}>{row.val}</p>
          </div>
        ))}

        {data.notes && (
          <div style={{ background: "rgba(0,180,220,0.05)", borderRadius: 8, padding: "14px 16px", borderLeft: "2px solid rgba(0,200,240,0.2)", borderTop: "1px solid rgba(0,200,240,0.1)" }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,200,240,0.5)", marginBottom: 6 }}>Notes</div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.7)", lineHeight: 1.75, margin: 0 }}>{data.notes}</p>
          </div>
        )}
      </div>
    );
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CalculatorGuide system="humandesign" hasData={Object.values(data).some(v => v.trim())} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>Type</FieldLabel>
          <select style={selectStyle} value={data.type} onChange={set("type")}>
            <option value="">Select type…</option>
            {Object.keys(HD_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Profile</FieldLabel>
          <input style={inputStyle} value={data.profile} onChange={set("profile")} placeholder="e.g. 3/5, 1/3, 6/2…" />
        </div>
        <div>
          <FieldLabel>Strategy</FieldLabel>
          <input style={inputStyle} value={data.strategy} onChange={set("strategy")} placeholder={HD_TYPES[data.type]?.strategy ?? "e.g. Wait to Respond"} />
        </div>
        <div>
          <FieldLabel>Authority</FieldLabel>
          <input style={inputStyle} value={data.authority} onChange={set("authority")} placeholder="e.g. Sacral, Emotional, Splenic…" />
        </div>
      </div>
      <div>
        <FieldLabel hint="comma-separated">Defined Centers</FieldLabel>
        <input style={inputStyle} value={data.definedCenters} onChange={set("definedCenters")} placeholder="e.g. Sacral, Heart, Throat, G Center" />
      </div>
      <div>
        <FieldLabel hint="from your chart">Channels</FieldLabel>
        <input style={inputStyle} value={data.channels} onChange={set("channels")} placeholder="e.g. Channel of Power (34-57), Channel of Discovery (29-46)…" />
      </div>
      <div>
        <FieldLabel hint="defined gates">Gates</FieldLabel>
        <input style={inputStyle} value={data.gates} onChange={set("gates")} placeholder="e.g. Gate 1, Gate 8, Gate 34, Gate 57…" />
      </div>
      <div>
        <FieldLabel>Notes & Insights</FieldLabel>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={data.notes} onChange={set("notes")} placeholder="Personal observations, patterns you've noticed, what resonates most…" />
      </div>
    </div>
  );
}

// ─── Astrology Tab ────────────────────────────────────────────────────────────
const PLANETS = [
  { key: "sun", label: "Sun ☉" }, { key: "moon", label: "Moon ☽" }, { key: "rising", label: "Rising / Ascendant" },
  { key: "mercury", label: "Mercury ☿" }, { key: "venus", label: "Venus ♀" }, { key: "mars", label: "Mars ♂" },
  { key: "jupiter", label: "Jupiter ♃" }, { key: "saturn", label: "Saturn ♄" }, { key: "northNode", label: "North Node ☊" },
] as const;

function AstrologyTab({ data, editing, onChange }: { data: AstrologyProfile; editing: boolean; onChange: (d: AstrologyProfile) => void }) {
  const set = (key: keyof AstrologyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...data, [key]: e.target.value });

  const color = "rgba(180,140,255,0.7)";

  if (!editing) {
    const hasData = PLANETS.some(p => data[p.key].trim());
    if (!hasData) return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(222,211,200,0.35)", fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13 }}>
        No astrology profile entered yet.
      </div>
    );

    const big3 = [{ key: "sun", label: "Sun" }, { key: "moon", label: "Moon" }, { key: "rising", label: "Rising" }] as const;
    const rest = PLANETS.filter(p => !["sun", "moon", "rising"].includes(p.key));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Big 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {big3.map(({ key, label }) => data[key] ? (
            <div key={key} style={{ background: "rgba(130,80,200,0.1)", borderRadius: 8, padding: "16px 14px", textAlign: "center", borderTop: `1px solid ${color.replace("0.7", "0.2")}`, borderLeft: `1px solid ${color.replace("0.7", "0.12")}`, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)" }}>
              <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "Lora, Georgia, serif", fontSize: 18, fontWeight: 600, color: "#DED3C8" }}>{data[key]}</div>
            </div>
          ) : null)}
        </div>

        {/* Remaining planets */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {rest.map(p => data[p.key] ? (
            <div key={p.key} style={{ background: "rgba(2,12,30,0.4)", borderRadius: 7, padding: "11px 14px", borderLeft: `2px solid ${color.replace("0.7", "0.25")}`, borderTop: `1px solid ${color.replace("0.7", "0.12")}`, boxShadow: "inset 0 2px 5px rgba(0,0,0,0.22)" }}>
              <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color, marginBottom: 3 }}>{p.label}</div>
              <div style={{ fontFamily: "Lora, Georgia, serif", fontSize: 14, color: "rgba(222,211,200,0.85)" }}>{data[p.key]}</div>
            </div>
          ) : null)}
        </div>

        {data.notes && (
          <div style={{ background: "rgba(130,80,200,0.06)", borderRadius: 8, padding: "14px 16px", borderLeft: "2px solid rgba(180,140,255,0.25)", borderTop: "1px solid rgba(180,140,255,0.12)" }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color, marginBottom: 6 }}>Notes & Patterns</div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.7)", lineHeight: 1.75, margin: 0 }}>{data.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CalculatorGuide system="astrology" hasData={PLANETS.some(p => data[p.key].trim())} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {PLANETS.map(p => (
          <div key={p.key}>
            <FieldLabel>{p.label}</FieldLabel>
            <input style={inputStyle} value={data[p.key]} onChange={set(p.key)} placeholder={`e.g. ${p.key === "sun" ? "Scorpio" : p.key === "moon" ? "Pisces" : p.key === "rising" ? "Leo Rising" : "Sign + House"}`} />
          </div>
        ))}
      </div>
      <div>
        <FieldLabel>Notes, Aspects & Interpretations</FieldLabel>
        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={data.notes} onChange={set("notes")} placeholder="Key aspects, stelliums, patterns, themes from your birth chart reading…" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlueprintPage() {
  const [blueprint, setBlueprint] = useState<Blueprint>(EMPTY_BLUEPRINT);
  const [activeTab, setActiveTab] = useState<"genekeys" | "humandesign" | "astrology">("genekeys");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Blueprint>(EMPTY_BLUEPRINT);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Blueprint;
        setBlueprint(parsed);
        setDraft(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const startEdit = () => { setDraft(blueprint); setEditing(true); };
  const cancelEdit = () => { setDraft(blueprint); setEditing(false); };
  const saveEdit = () => {
    setBlueprint(draft);
    setEditing(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  };

  const calculate = useCallback(async () => {
    const bd = blueprint.birthData;
    if (!bd.date || !bd.time || !bd.city) {
      setCalcError("Add your birth date, time, and city first (in the Birth Data panel above).");
      return;
    }
    setCalculating(true);
    setCalcError("");
    try {
      const res = await fetch("/api/blueprint/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bd),
      });
      const data = await res.json();
      if (!res.ok) { setCalcError(data.error ?? "Calculation failed"); return; }

      const { astrology: a, humanDesign: hd } = data;
      setBlueprint(prev => {
        const next: Blueprint = {
          ...prev,
          humanDesign: {
            ...prev.humanDesign,
            type:           hd.type,
            profile:        hd.profile,
            authority:      hd.authority,
            strategy:       hd.strategy,
            definedCenters: hd.definedCenters.join(", "),
            channels:       hd.channels.join(", "),
            gates:          hd.gates,
          },
          astrology: {
            ...prev.astrology,
            sun:      a.sunSign,
            moon:     a.moonSign,
            rising:   a.risingSign,
            mercury:  a.mercurySign,
            venus:    a.venusSign,
            mars:     a.marsSign,
            jupiter:  a.jupiterSign,
            saturn:   a.saturnSign,
            northNode: a.northNodeSign,
          },
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    } catch {
      setCalcError("Network error — please try again.");
    } finally {
      setCalculating(false);
    }
  }, [blueprint.birthData]);

  const completedSections = [
    Object.values(blueprint.geneKeys).some(v => v.trim()),
    Object.values(blueprint.humanDesign).some(v => v.trim()),
    PLANETS.some(p => blueprint.astrology[p.key].trim()),
  ].filter(Boolean).length;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(194,159,96,0.65)", marginBottom: 6 }}>
          Personal Blueprint · {completedSections}/3 sections complete
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: 32, color: "#DED3C8", margin: 0, lineHeight: 1.1 }}>
            My Blueprint
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button onClick={cancelEdit} style={{ padding: "9px 18px", borderRadius: 7, cursor: "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: "rgba(255,255,255,0.05)", color: "rgba(222,211,200,0.55)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                  Cancel
                </button>
                <button onClick={saveEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 7, cursor: "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)" }}>
                  <Save style={{ width: 13, height: 13 }} /> Save Blueprint
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={calculate}
                  disabled={calculating}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 7, cursor: calculating ? "default" : "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: calculating ? "rgba(130,90,220,0.12)" : "linear-gradient(160deg, rgba(130,90,220,0.22) 0%, rgba(80,40,160,0.18) 100%)", color: calculating ? "rgba(180,140,255,0.4)" : "rgba(180,140,255,0.9)", border: "1px solid rgba(130,90,220,0.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)" }}
                >
                  {calculating
                    ? <><Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Calculating…</>
                    : <><Sparkles style={{ width: 12, height: 12 }} /> Calculate</>
                  }
                </button>
                <button onClick={startEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 7, cursor: "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: "rgba(255,255,255,0.06)", color: "rgba(222,211,200,0.75)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.3)" }}>
                  <Edit2 style={{ width: 12, height: 12 }} /> Edit Blueprint
                </button>
              </>
            )}
          </div>
        </div>
        <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.45)", margin: "10px 0 0" }}>
          Your energetic architecture — Gene Keys, Human Design, and Astrology — mapped as one living document.
        </p>
      </div>

      {/* Birth Data Panel */}
      <BirthDataPanel
        data={editing ? draft.birthData : blueprint.birthData}
        editing={editing}
        onChange={d => setDraft(prev => ({ ...prev, birthData: d }))}
      />
      {calcError && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20, padding: "11px 14px", borderRadius: 8, background: "rgba(255,80,80,0.06)", borderLeft: "2px solid rgba(255,80,80,0.4)", borderTop: "1px solid rgba(255,80,80,0.2)" }}>
          <AlertCircle size={13} color="rgba(255,100,100,0.8)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(255,160,160,0.85)", lineHeight: 1.55 }}>{calcError}</span>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: isActive ? 700 : 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: isActive ? tab.color : "rgba(222,211,200,0.4)",
              borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s",
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "genekeys" && (
          <GeneKeysTab
            data={editing ? draft.geneKeys : blueprint.geneKeys}
            editing={editing}
            onChange={d => setDraft(prev => ({ ...prev, geneKeys: d }))}
          />
        )}
        {activeTab === "humandesign" && (
          <HumanDesignTab
            data={editing ? draft.humanDesign : blueprint.humanDesign}
            editing={editing}
            onChange={d => setDraft(prev => ({ ...prev, humanDesign: d }))}
          />
        )}
        {activeTab === "astrology" && (
          <AstrologyTab
            data={editing ? draft.astrology : blueprint.astrology}
            editing={editing}
            onChange={d => setDraft(prev => ({ ...prev, astrology: d }))}
          />
        )}
      </div>

      {/* Empty state prompt */}
      {!editing && completedSections === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0 0" }}>
          <button onClick={startEdit} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 50%, #D4B462 82%, #E0C878 100%)", color: "#08203A", border: "1.5px solid rgba(240,220,170,0.4)", boxShadow: "0 2px 0 rgba(20,12,0,0.85), 0 4px 12px rgba(0,0,0,0.5)" }}>
            <Fingerprint style={{ width: 14, height: 14 }} /> Begin Your Blueprint
          </button>
        </div>
      )}
    </div>
  );
}
