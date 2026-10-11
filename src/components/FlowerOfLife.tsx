// Geometrically correct Flower of Life — 19 circles on a true hexagonal grid
// Construction: center + 6 at radius r + 6 at radius 2r + 6 at radius r√3 (offset 30°)
// All circles share the same radius r, centers spaced r apart on the hex grid

const CX = 200, CY = 200, R = 55;
const R2 = R * Math.sqrt(3); // ≈ 95.26 — the "short diagonal" spacing

function hexCircles() {
  const deg = (d: number) => (d * Math.PI) / 180;

  // Ring 0 — center
  const ring0 = [{ x: CX, y: CY }];

  // Ring 1 — 6 circles at distance R, 0° 60° 120° 180° 240° 300°
  const ring1 = Array.from({ length: 6 }, (_, i) => ({
    x: CX + R * Math.cos(deg(i * 60)),
    y: CY - R * Math.sin(deg(i * 60)),
  }));

  // Ring 2A — 6 circles at distance 2R (same angles as ring 1)
  const ring2A = Array.from({ length: 6 }, (_, i) => ({
    x: CX + 2 * R * Math.cos(deg(i * 60)),
    y: CY - 2 * R * Math.sin(deg(i * 60)),
  }));

  // Ring 2B — 6 circles at distance R√3, angles offset 30° (fills the hex gaps)
  const ring2B = Array.from({ length: 6 }, (_, i) => ({
    x: CX + R2 * Math.cos(deg(i * 60 + 30)),
    y: CY - R2 * Math.sin(deg(i * 60 + 30)),
  }));

  return [...ring0, ...ring1, ...ring2A, ...ring2B]; // 19 circles total
}

const CIRCLES = hexCircles();

export default function FlowerOfLife({
  className = "",
  opacity = 0.12,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      style={{ opacity }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#C29F60" strokeWidth="0.75">
        {/* The 19 circles of the Flower of Life */}
        {CIRCLES.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={R} />
        ))}
        {/* Two enclosing rings — standard Flower of Life border */}
        <circle cx={CX} cy={CY} r={R * 2} />
        <circle cx={CX} cy={CY} r={R * 3} />
      </g>
    </svg>
  );
}
