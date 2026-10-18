import { NextRequest, NextResponse } from "next/server";

// ─── Astronomia imports ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { julian, solar, moonposition, planetposition, base, sidereal } = require("astronomia");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopMercury = require("astronomia/data/vsop87Bmercury").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopVenus   = require("astronomia/data/vsop87Bvenus").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopMars    = require("astronomia/data/vsop87Bmars").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopJupiter = require("astronomia/data/vsop87Bjupiter").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopSaturn  = require("astronomia/data/vsop87Bsaturn").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopUranus  = require("astronomia/data/vsop87Buranus").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vsopNeptune = require("astronomia/data/vsop87Bneptune").default;

// ─── Zodiac ───────────────────────────────────────────────────────────────────
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
               "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function degToSign(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  const signIdx = Math.floor(d / 30);
  const pos = d % 30;
  return `${SIGNS[signIdx]} ${pos.toFixed(1)}°`;
}

function signOnly(deg: number): string {
  return SIGNS[Math.floor(((deg % 360) + 360) % 360 / 30)];
}

// ─── Planet longitude helpers ─────────────────────────────────────────────────
function sunLon(jd: number): number {
  return ((solar.apparentLongitude(jd) * 180 / Math.PI) % 360 + 360) % 360;
}

function moonLon(jd: number): number {
  return ((moonposition.position(jd).lon * 180 / Math.PI) % 360 + 360) % 360;
}

function planetLon(vsop: unknown, jd: number): number {
  const p = new planetposition.Planet(vsop);
  return ((p.position(jd).lon * 180 / Math.PI) % 360 + 360) % 360;
}

function northNodeLon(jd: number): number {
  return ((moonposition.trueNode(jd) * 180 / Math.PI) % 360 + 360) % 360;
}

// ─── Ascendant ────────────────────────────────────────────────────────────────
function ascendant(jd: number, latDeg: number, lonDeg: number): number {
  const latRad = latDeg * Math.PI / 180;
  const gst = sidereal.apparent(jd);                        // radians
  const lst = ((gst * 180 / Math.PI + lonDeg) % 360 + 360) % 360;
  const ARMCrad = lst * Math.PI / 180;
  const T = base.J2000Century(jd);
  const oblRad = (23.439291111 - 0.013004167 * T) * Math.PI / 180;
  const y = -Math.cos(ARMCrad);
  const x = Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(ARMCrad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  if (Math.cos(ARMCrad) < 0) asc += 180;
  return ((asc % 360) + 360) % 360;
}

// ─── Human Design gate wheel ──────────────────────────────────────────────────
// Gate sequence counterclockwise from 2° Cancer (92°), each gate = 5.625°
const HD_GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42, 3,
  27,24, 2,23, 8,20,16,35,45,12,15,52,39,53,62,56,
  31,33, 7, 4,29,59,40,64,47, 6,46,18,48,57,32,50,
  28,44, 1,43,14,34, 9, 5,26,11,10,58,38,54,61,60,
];
const GATE_START_DEG = 92.0;

function lonToGateAndLine(deg: number): { gate: number; line: number } {
  const offset = ((deg - GATE_START_DEG) % 360 + 360) % 360;
  const idx = Math.floor(offset / 5.625);
  const lineNum = Math.min(Math.floor((offset % 5.625) / 0.9375) + 1, 6);
  return { gate: HD_GATE_WHEEL[idx] ?? 0, line: lineNum };
}

// ─── HD channel & center definitions ─────────────────────────────────────────
// Each channel = [gateA, gateB, centerA, centerB]
const CHANNELS: [number, number, string, string][] = [
  [ 1,  8, "G",         "Throat"],
  [ 2, 14, "G",         "Sacral"],
  [ 3, 60, "Sacral",    "Root"],
  [ 4, 63, "Ajna",      "Head"],
  [ 5, 15, "Sacral",    "G"],
  [ 6, 59, "Solar Plexus","Sacral"],
  [ 7, 31, "G",         "Throat"],
  [ 9, 52, "Sacral",    "Root"],
  [10, 20, "G",         "Throat"],
  [10, 34, "G",         "Sacral"],
  [10, 57, "G",         "Spleen"],
  [11, 56, "Ajna",      "Throat"],
  [12, 22, "Throat",    "Solar Plexus"],
  [13, 33, "G",         "Throat"],
  [16, 48, "Throat",    "Spleen"],
  [17, 62, "Ajna",      "Throat"],
  [18, 58, "Spleen",    "Root"],
  [19, 49, "Root",      "Solar Plexus"],
  [20, 34, "Throat",    "Sacral"],
  [20, 57, "Throat",    "Spleen"],
  [21, 45, "Heart",     "Throat"],
  [23, 43, "Throat",    "Ajna"],
  [24, 61, "Ajna",      "Head"],
  [25, 51, "G",         "Heart"],
  [26, 44, "Heart",     "Spleen"],
  [27, 50, "Sacral",    "Spleen"],
  [28, 38, "Spleen",    "Root"],
  [29, 46, "Sacral",    "G"],
  [30, 41, "Solar Plexus","Root"],
  [31,  7, "Throat",    "G"],
  [32, 54, "Spleen",    "Root"],
  [33, 13, "Throat",    "G"],
  [34, 57, "Sacral",    "Spleen"],
  [35, 36, "Throat",    "Solar Plexus"],
  [37, 40, "Solar Plexus","Heart"],
  [39, 55, "Root",      "Solar Plexus"],
  [42, 53, "Sacral",    "Root"],
  [44, 26, "Spleen",    "Heart"],
  [45, 21, "Throat",    "Heart"],
  [46, 29, "G",         "Sacral"],
  [47, 64, "Ajna",      "Head"],
  [48, 16, "Spleen",    "Throat"],
  [49, 19, "Solar Plexus","Root"],
  [50, 27, "Spleen",    "Sacral"],
  [51, 25, "Heart",     "G"],
  [52,  9, "Root",      "Sacral"],
  [53, 42, "Root",      "Sacral"],
  [54, 32, "Root",      "Spleen"],
  [55, 39, "Solar Plexus","Root"],
  [57, 10, "Spleen",    "G"],
  [57, 20, "Spleen",    "Throat"],
  [57, 34, "Spleen",    "Sacral"],
  [58, 18, "Root",      "Spleen"],
  [59,  6, "Sacral",    "Solar Plexus"],
  [60,  3, "Root",      "Sacral"],
  [61, 24, "Head",      "Ajna"],
  [62, 17, "Throat",    "Ajna"],
  [63,  4, "Head",      "Ajna"],
  [64, 47, "Head",      "Ajna"],
];

const MOTOR_CENTERS = new Set(["Sacral", "Solar Plexus", "Root", "Heart"]);

function deriveHDType(gates: Set<number>): {
  type: string; authority: string; strategy: string;
  definedCenters: string[]; channels: string[];
} {
  const activeChannels: string[] = [];
  const definedCenterSet = new Set<string>();

  for (const [a, b, cA, cB] of CHANNELS) {
    if (gates.has(a) && gates.has(b)) {
      activeChannels.push(`${a}-${b}`);
      definedCenterSet.add(cA);
      definedCenterSet.add(cB);
    }
  }

  const defined = [...definedCenterSet];
  const hasSacral = definedCenterSet.has("Sacral");
  const hasThroat = definedCenterSet.has("Throat");
  const motorToThroat = hasThroat && [...MOTOR_CENTERS].some(m => {
    if (!definedCenterSet.has(m)) return false;
    return CHANNELS.some(([a, b, cA, cB]) =>
      gates.has(a) && gates.has(b) &&
      ((cA === m && cB === "Throat") || (cA === "Throat" && cB === m))
    );
  });

  let type: string;
  let authority: string;
  let strategy: string;

  if (defined.length === 0) {
    type = "Reflector"; authority = "Lunar"; strategy = "Wait a Lunar Cycle";
  } else if (hasSacral && motorToThroat) {
    type = "Manifesting Generator"; authority = "Sacral"; strategy = "Wait to Respond, then Inform";
  } else if (hasSacral) {
    type = "Generator"; authority = "Sacral"; strategy = "Wait to Respond";
  } else if (motorToThroat) {
    type = "Manifestor"; strategy = "Inform Before You Act";
    if (definedCenterSet.has("Solar Plexus")) authority = "Emotional";
    else if (definedCenterSet.has("Heart")) authority = "Ego";
    else if (definedCenterSet.has("Spleen")) authority = "Splenic";
    else authority = "Emotional";
  } else {
    type = "Projector"; strategy = "Wait for the Invitation";
    if (definedCenterSet.has("Solar Plexus")) authority = "Emotional";
    else if (definedCenterSet.has("Spleen")) authority = "Splenic";
    else if (definedCenterSet.has("Heart")) authority = "Ego";
    else if (definedCenterSet.has("G")) authority = "Self-Projected";
    else authority = "Mental";
  }

  return { type, authority, strategy, definedCenters: defined, channels: activeChannels };
}

// ─── Geocoding via Nominatim ──────────────────────────────────────────────────
async function geocodeCity(city: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "JMC-Portal/1.0 rng@thejourneymencollective.com" } });
    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  } catch { return null; }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { date, time, city } = await request.json() as { date: string; time: string; city: string };

  if (!date || !time || !city) {
    return NextResponse.json({ error: "date, time, and city are required" }, { status: 400 });
  }

  // Geocode
  const geo = await geocodeCity(city);
  if (!geo) {
    return NextResponse.json({ error: `Could not find coordinates for "${city}". Try a more specific city name.` }, { status: 422 });
  }

  // Parse datetime → Julian Day (treating local time as-is; offset ~0 for gate calc)
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const dayFrac = d + (h + min / 60) / 24;
  const jdBirth = julian.CalendarGregorianToJD(y, m, dayFrac);

  // Design JD: ~88.736 days before birth sun position
  const jdDesign = jdBirth - 88.736;

  // ── Astrology ────────────────────────────────────────────────────────────────
  const sunDeg    = sunLon(jdBirth);
  const moonDeg   = moonLon(jdBirth);
  const ascDeg    = ascendant(jdBirth, geo.lat, geo.lng);
  const mercDeg   = planetLon(vsopMercury, jdBirth);
  const venusDeg  = planetLon(vsopVenus,   jdBirth);
  const marsDeg   = planetLon(vsopMars,    jdBirth);
  const jupDeg    = planetLon(vsopJupiter, jdBirth);
  const satDeg    = planetLon(vsopSaturn,  jdBirth);
  const uraDeg    = planetLon(vsopUranus,  jdBirth);
  const nepDeg    = planetLon(vsopNeptune, jdBirth);
  const nodeDeg   = northNodeLon(jdBirth);

  // ── Human Design ─────────────────────────────────────────────────────────────
  // Personality (conscious) planets at birth
  const pSun   = lonToGateAndLine(sunDeg);
  const pEarth = lonToGateAndLine((sunDeg + 180) % 360);   // Earth = opposite Sun
  const pMoon  = lonToGateAndLine(moonDeg);
  const pNode  = lonToGateAndLine(nodeDeg);
  const pSNode = lonToGateAndLine((nodeDeg + 180) % 360);
  const pMerc  = lonToGateAndLine(mercDeg);
  const pVenus = lonToGateAndLine(venusDeg);
  const pMars  = lonToGateAndLine(marsDeg);
  const pJup   = lonToGateAndLine(jupDeg);
  const pSat   = lonToGateAndLine(satDeg);
  const pUra   = lonToGateAndLine(uraDeg);
  const pNep   = lonToGateAndLine(nepDeg);

  // Design (unconscious) planets 88.736° solar arc before birth
  const dSunDeg   = sunLon(jdDesign);
  const dMoonDeg  = moonLon(jdDesign);
  const dMercDeg  = planetLon(vsopMercury, jdDesign);
  const dVenusDeg = planetLon(vsopVenus,   jdDesign);
  const dMarsDeg  = planetLon(vsopMars,    jdDesign);
  const dJupDeg   = planetLon(vsopJupiter, jdDesign);
  const dSatDeg   = planetLon(vsopSaturn,  jdDesign);
  const dUraDeg   = planetLon(vsopUranus,  jdDesign);
  const dNepDeg   = planetLon(vsopNeptune, jdDesign);
  const dNodeDeg  = northNodeLon(jdDesign);

  const dSun   = lonToGateAndLine(dSunDeg);
  const dEarth = lonToGateAndLine((dSunDeg + 180) % 360);
  const dMoon  = lonToGateAndLine(dMoonDeg);
  const dNode  = lonToGateAndLine(dNodeDeg);
  const dSNode = lonToGateAndLine((dNodeDeg + 180) % 360);
  const dMerc  = lonToGateAndLine(dMercDeg);
  const dVenus = lonToGateAndLine(dVenusDeg);
  const dMars  = lonToGateAndLine(dMarsDeg);
  const dJup   = lonToGateAndLine(dJupDeg);
  const dSat   = lonToGateAndLine(dSatDeg);
  const dUra   = lonToGateAndLine(dUraDeg);
  const dNep   = lonToGateAndLine(dNepDeg);

  // All activated gates
  const allGates = new Set([
    pSun.gate, pEarth.gate, pMoon.gate, pNode.gate, pSNode.gate,
    pMerc.gate, pVenus.gate, pMars.gate, pJup.gate, pSat.gate, pUra.gate, pNep.gate,
    dSun.gate, dEarth.gate, dMoon.gate, dNode.gate, dSNode.gate,
    dMerc.gate, dVenus.gate, dMars.gate, dJup.gate, dSat.gate, dUra.gate, dNep.gate,
  ].filter(g => g > 0));

  const { type, authority, strategy, definedCenters, channels } = deriveHDType(allGates);
  const profile = `${pSun.line}/${pEarth.line}`;

  const gateList = [
    ...new Set([
      pSun.gate, pEarth.gate, pMoon.gate, pMerc.gate, pVenus.gate, pMars.gate,
      pJup.gate, pSat.gate, pUra.gate, pNep.gate, pNode.gate, pSNode.gate,
      dSun.gate, dEarth.gate, dMoon.gate, dMerc.gate, dVenus.gate, dMars.gate,
      dJup.gate, dSat.gate, dUra.gate, dNep.gate, dNode.gate, dSNode.gate,
    ].filter(g => g > 0))
  ].sort((a, b) => a - b);

  return NextResponse.json({
    astrology: {
      sun:      degToSign(sunDeg),
      moon:     degToSign(moonDeg),
      rising:   degToSign(ascDeg),
      mercury:  degToSign(mercDeg),
      venus:    degToSign(venusDeg),
      mars:     degToSign(marsDeg),
      jupiter:  degToSign(jupDeg),
      saturn:   degToSign(satDeg),
      uranus:   degToSign(uraDeg),
      neptune:  degToSign(nepDeg),
      northNode: degToSign(nodeDeg),
      // compact sign names for pre-fill
      sunSign:      signOnly(sunDeg),
      moonSign:     signOnly(moonDeg),
      risingSign:   signOnly(ascDeg),
      mercurySign:  signOnly(mercDeg),
      venusSign:    signOnly(venusDeg),
      marsSign:     signOnly(marsDeg),
      jupiterSign:  signOnly(jupDeg),
      saturnSign:   signOnly(satDeg),
      northNodeSign: signOnly(nodeDeg),
    },
    humanDesign: {
      type,
      profile,
      authority,
      strategy,
      definedCenters,
      channels,
      gates: gateList.join(", "),
      // Personality positions (for reference)
      personality: {
        sun: `${pSun.gate}.${pSun.line}`,
        earth: `${pEarth.gate}.${pEarth.line}`,
        moon: `${pMoon.gate}.${pMoon.line}`,
        northNode: `${pNode.gate}.${pNode.line}`,
        southNode: `${pSNode.gate}.${pSNode.line}`,
        mercury: `${pMerc.gate}.${pMerc.line}`,
        venus: `${pVenus.gate}.${pVenus.line}`,
        mars: `${pMars.gate}.${pMars.line}`,
        jupiter: `${pJup.gate}.${pJup.line}`,
        saturn: `${pSat.gate}.${pSat.line}`,
        uranus: `${pUra.gate}.${pUra.line}`,
        neptune: `${pNep.gate}.${pNep.line}`,
      },
      design: {
        sun: `${dSun.gate}.${dSun.line}`,
        earth: `${dEarth.gate}.${dEarth.line}`,
        moon: `${dMoon.gate}.${dMoon.line}`,
        northNode: `${dNode.gate}.${dNode.line}`,
        southNode: `${dSNode.gate}.${dSNode.line}`,
        mercury: `${dMerc.gate}.${dMerc.line}`,
        venus: `${dVenus.gate}.${dVenus.line}`,
        mars: `${dMars.gate}.${dMars.line}`,
        jupiter: `${dJup.gate}.${dJup.line}`,
        saturn: `${dSat.gate}.${dSat.line}`,
        uranus: `${dUra.gate}.${dUra.line}`,
        neptune: `${dNep.gate}.${dNep.line}`,
      },
    },
    geo: { lat: geo.lat, lng: geo.lng, city: geo.display },
  });
}
