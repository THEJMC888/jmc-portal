import type { Totem } from "@/lib/totems";

// A shared family of gold line glyphs: the alchemical sign of the animal's
// element at the center, an ornament for its kind, and a ring of compass ticks
// whose count and turn come from the name, so no two animals look identical.

const GOLD = "#C29F60";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function ElementSign({ element }: { element: Totem["element"] }) {
  const up = element === "fire" || element === "air";
  // Equilateral triangle, side 22, centered on (32, 32)
  const pts = up ? "32,19.5 43,38.5 21,38.5" : "32,44.5 43,25.5 21,25.5";
  const barY = up ? 32.5 : 31.5;
  return (
    <g>
      <polygon points={pts} />
      {(element === "air" || element === "earth") && <line x1={24.5} y1={barY} x2={39.5} y2={barY} />}
    </g>
  );
}

function KindOrnament({ kind }: { kind: Totem["kind"] }) {
  switch (kind) {
    case "bird":
      // Two rising wings
      return (
        <g>
          <path d="M18 30 C 13 25, 11 20, 12 14 C 15 19, 18 22, 22 24" />
          <path d="M46 30 C 51 25, 53 20, 52 14 C 49 19, 46 22, 42 24" />
        </g>
      );
    case "mammal":
      // Four paw points on the cardinal axes
      return (
        <g fill={GOLD} stroke="none">
          {[[32, 9.5], [54.5, 32], [32, 54.5], [9.5, 32]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />)}
        </g>
      );
    case "insect": {
      // Honeycomb hexagon
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        return `${(32 + 22 * Math.cos(a)).toFixed(2)},${(32 + 22 * Math.sin(a)).toFixed(2)}`;
      }).join(" ");
      return <polygon points={pts} strokeOpacity={0.55} />;
    }
    case "water":
      // Two waves beneath the sign
      return (
        <g>
          <path d="M20 48 q 3 -3 6 0 t 6 0 t 6 0 t 6 0" />
          <path d="M23 52.5 q 3 -3 6 0 t 6 0 t 6 0" strokeOpacity={0.6} />
        </g>
      );
    case "reptile":
      // Ouroboros: an inner ring with a gap and a head
      return (
        <g>
          <path d="M 32 10 A 22 22 0 1 1 26.3 10.75" strokeOpacity={0.6} />
          <circle cx={32} cy={10} r={1.7} fill={GOLD} stroke="none" />
        </g>
      );
  }
}

export default function TotemGlyph({ totem, size = 56 }: { totem: Totem; size?: number }) {
  const h = hash(totem.slug);
  const ticks = 6 + (h % 7);           // 6 to 12 compass ticks
  const turn = (h >> 3) % 30;          // degrees
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      fill="none" stroke={GOLD} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round"
      role="img" aria-label={`${totem.name} glyph`}
      style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(194,159,96,0.25))" }}
    >
      <circle cx={32} cy={32} r={30} strokeOpacity={0.7} />
      <circle cx={32} cy={32} r={27.5} strokeOpacity={0.22} />
      <g transform={`rotate(${turn} 32 32)`} strokeOpacity={0.75}>
        {Array.from({ length: ticks }, (_, i) => (
          <line key={i} x1={32} y1={2} x2={32} y2={4.5} transform={`rotate(${(360 / ticks) * i} 32 32)`} />
        ))}
      </g>
      <KindOrnament kind={totem.kind} />
      <ElementSign element={totem.element} />
      <circle cx={32} cy={32} r={1.3} fill={GOLD} stroke="none" />
    </svg>
  );
}
