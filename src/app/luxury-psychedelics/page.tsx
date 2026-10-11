"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu, X, ArrowRight, Star, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── Exact Luxex palette from theme CSS ─── */
const C = {
  dark: "#191919",
  darkAlt: "#111111",
  text: "#5f5f5f",
  lightBg: "#f7f7f7",
  white: "#ffffff",
  gold: "#c9a86c",          // warm Luxex-style gold
  goldAccent: "#f3bf3d",    // exact Luxex accent from CSS
  border: "#e5e5e5",
  borderMid: "#d5d0c8",
};

/* ─── Exact Luxex fonts from functions.php enqueue ─── */
const FONTS = `https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap`;

/* ─── Typography primitives ─── */
const display = (size: string, weight = 300, italic = false) => ({
  fontFamily: "Raleway, sans-serif",
  fontWeight: weight,
  fontStyle: italic ? "italic" : "normal",
  fontSize: size,
  lineHeight: 1.1,
  letterSpacing: "0.02em",
} as React.CSSProperties);

const label = (color = C.gold) => ({
  fontFamily: "Montserrat, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.3em",
  fontSize: "0.62rem",
  color,
});

const mono = (size = "0.85rem", weight = 400) => ({
  fontFamily: "Montserrat, sans-serif",
  fontWeight: weight,
  fontSize: size,
  letterSpacing: "0.02em",
} as React.CSSProperties);

/* ─── Shared components ─── */
const GoldDiamond = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${C.gold})` }} />
    <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: C.gold }} />
    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${C.gold})` }} />
  </div>
);

const SectionLabel = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p style={label(light ? "rgba(201,168,108,0.9)" : C.gold)}>{children}</p>
);

const Display = ({
  children, size = "clamp(2.2rem, 5vw, 3.5rem)", weight = 300, italic = false, light = false, className = ""
}: {
  children: React.ReactNode; size?: string; weight?: number; italic?: boolean; light?: boolean; className?: string;
}) => (
  <h2 className={className} style={{ ...display(size, weight, italic), color: light ? C.white : C.darkAlt }}>
    {children}
  </h2>
);

const GoldBtn = ({
  href, children, outline = false, dark = false
}: { href: string; children: React.ReactNode; outline?: boolean; dark?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  const filled = !outline;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 px-8 py-3.5 transition-all duration-300"
      style={{
        ...mono("0.65rem", 700),
        textTransform: "uppercase",
        letterSpacing: "0.25em",
        background: filled ? (hovered ? C.darkAlt : C.gold) : (hovered ? C.gold : "transparent"),
        color: C.white,
        border: `1px solid ${outline ? (dark ? "rgba(255,255,255,0.5)" : C.gold) : C.gold}`,
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
};

/* ─── Video Intro — Luxex opening screen effect ─────────────────────────────
   Technique: video plays behind a full-screen white overlay. The white overlay
   uses mix-blend-mode: screen so black text punches through, revealing the
   video inside the letter shapes — exactly the Luxex intro screenshot.
─────────────────────────────────────────────────────────────────────────── */
function VideoIntro() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", background: "#000" }}
    >
      {/* ── Luxex demo video (exact URL from theme sample data) ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.85 }}
      >
        <source src="https://www.11-76.com/html5-videos-22/luxex/luxex.mp4" type="video/mp4" />
        {/* Fallback to hero image if video can't load */}
        <img src="/luxex/hero-bg-1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      </video>

      {/* ── White foreground with mix-blend-mode: screen ──
          Black text on this layer acts as a "window" into the video below,
          while white areas stay white. Exact Luxex intro technique. ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: "#fff", mixBlendMode: "screen" }}
      >
        {/* Luxex-style vertical column lines */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${20 + i * 15}%`,
              width: 1,
              background: "rgba(0,0,0,0.08)",
            }}
          />
        ))}

        {/* H1 — Luxury Psychedelics, split across two lines */}
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(3rem, 9.5vw, 8.5rem)",
            color: "#111",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            userSelect: "none",
            textAlign: "center",
            margin: 0,
          }}
        >
          LUXURY
        </h1>
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(3rem, 9.5vw, 8.5rem)",
            color: "#111",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            userSelect: "none",
            textAlign: "center",
            margin: 0,
          }}
        >
          PSYCHEDELICS
        </h1>
      </div>

      {/* ── Enter CTA — sits outside the blend layer so it's always visible ── */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6 z-10">
        {/* Vertical line + diamond above button */}
        <div className="flex flex-col items-center gap-1.5 animate-bounce" style={{ animationDuration: "2s" }}>
          <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.35)" }} />
          <div className="w-2.5 h-2.5 rotate-45" style={{ border: "1px solid rgba(255,255,255,0.55)" }} />
        </div>

        <a
          href="#main-hero"
          className="group flex items-center gap-3 px-10 py-4 transition-all duration-300"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.35em",
            color: "#fff",
            background: C.gold,
            border: `1px solid ${C.gold}`,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.border = "1px solid #fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = C.gold;
            (e.currentTarget as HTMLElement).style.border = `1px solid ${C.gold}`;
          }}
        >
          Enter the Experience
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}

/* ─── Navigation — exact Luxex sticky header pattern ─── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["Experiences", "Philosophy", "Retreats", "Facilitators", "Contact"];

  return (
    <>
      <style>{`
        @import url('${FONTS}');
        * { box-sizing: border-box; }
        ::selection { background: ${C.gold}; color: white; }
        html { scroll-behavior: smooth; }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(25,25,25,0.98)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid rgba(201,168,108,0.12)` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-12 flex items-center justify-between" style={{ height: 80 }}>
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 flex-shrink-0 no-underline">
            <div className="flex flex-col items-center">
              <p style={{ ...mono("0.62rem", 800), textTransform: "uppercase", letterSpacing: "0.35em", color: C.white, lineHeight: 1.2 }}>
                Luxury
              </p>
              <p style={{ ...display("0.75rem", 300, true), color: C.gold, lineHeight: 1, letterSpacing: "0.15em" }}>
                Psychedelics
              </p>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-10">
            {links.map((l) => (
              <NavLink key={l} href={`#${l.toLowerCase()}`}>{l}</NavLink>
            ))}
            <a
              href="#contact"
              className="px-6 py-2.5 transition-all duration-200"
              style={{ ...mono("0.6rem", 700), textTransform: "uppercase", letterSpacing: "0.22em", background: C.gold, color: C.white, textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.darkAlt)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.gold)}
            >
              Apply Now
            </a>
          </div>

          <button className="lg:hidden" style={{ color: C.white, background: "none", border: "none", cursor: "pointer" }} onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden px-8 pb-8 flex flex-col gap-5" style={{ background: C.darkAlt, borderTop: `1px solid rgba(201,168,108,0.12)` }}>
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} style={{ ...mono("0.7rem", 700), textTransform: "uppercase", letterSpacing: "0.2em", color: C.white, textDecoration: "none" }}>{l}</a>
            ))}
            <a href="#contact" style={{ ...mono("0.65rem", 700), textTransform: "uppercase", letterSpacing: "0.2em", background: C.gold, color: C.white, padding: "12px 24px", textDecoration: "none", alignSelf: "flex-start" }}>Apply Now</a>
          </div>
        )}
      </nav>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      style={{ ...mono("0.62rem", 600), textTransform: "uppercase", letterSpacing: "0.18em", color: hovered ? C.gold : "rgba(255,255,255,0.72)", transition: "color 0.2s", textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
}

/* ─── Hero — fullscreen Luxex parallax style ─── */
function Hero() {
  return (
    <section id="main-hero" className="relative flex flex-col items-center justify-center text-center overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Real Luxex hero background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/luxex/hero-bg-1.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Dark overlay — matches Luxex rgba(0,0,0,.55) */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.58)" }} />

      {/* Luxex vertical lines effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 9}%`,
              top: 0,
              bottom: 0,
              width: "1px",
              background: "linear-gradient(to bottom, transparent 0%, rgba(201,168,108,0.15) 30%, rgba(201,168,108,0.15) 70%, transparent 100%)",
            }}
          />
        ))}
      </div>

      {/* Top + bottom gold rules */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, rgba(201,168,108,0.6) 30%, rgba(201,168,108,0.6) 70%, transparent)` }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, rgba(201,168,108,0.6) 30%, rgba(201,168,108,0.6) 70%, transparent)` }} />

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-36 flex flex-col items-center">
        <p style={{ ...label("rgba(201,168,108,0.85)"), marginBottom: "1.5rem" }}>
          Private Members Collective · Est. 2024
        </p>

        {/* Luxex-style hero heading: Cormorant for luxe, tight tracking */}
        <h1
          style={{
            ...display("clamp(3.5rem, 9vw, 7.5rem)", 300),
            color: C.white,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.15em",
          }}
        >
          Where Healing
        </h1>
        <h1
          style={{
            ...display("clamp(3.5rem, 9vw, 7.5rem)", 400, true),
            color: C.gold,
            letterSpacing: "0.06em",
            marginBottom: "1.5rem",
          }}
        >
          Meets Luxury
        </h1>

        <div className="w-full max-w-sm mb-8">
          <GoldDiamond />
        </div>

        <p
          className="max-w-xl mb-10"
          style={{ ...mono("1rem", 300), color: "rgba(255,255,255,0.7)", lineHeight: 1.9, letterSpacing: "0.05em" }}
        >
          The world&apos;s most exclusive psychedelic retreat collective.
          Ancient wisdom. Exceptional sanctuaries. Uncompromising care.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <GoldBtn href="#contact">Request Membership</GoldBtn>
          <GoldBtn href="#experiences" outline dark>Explore Experiences</GoldBtn>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex flex-col items-center gap-2" style={{ color: "rgba(201,168,108,0.5)" }}>
          <div
            className="w-px h-10 animate-pulse"
            style={{ background: `linear-gradient(to bottom, transparent, ${C.gold})` }}
          />
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Stats bar — Luxex style bottom overlay */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(201,168,108,0.12)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-3">
          {[
            { num: "12+", label: "Global Sanctuaries" },
            { num: "200+", label: "Members Transformed" },
            { num: "100%", label: "Private & Discreet" },
          ].map((s, i) => (
            <div
              key={i}
              className="py-5 text-center"
              style={{ borderRight: i < 2 ? "1px solid rgba(201,168,108,0.12)" : "none" }}
            >
              <p style={{ ...display("1.8rem", 400), color: C.gold, lineHeight: 1 }}>{s.num}</p>
              <p className="mt-1" style={{ ...label("rgba(255,255,255,0.4)"), fontSize: "0.55rem" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function About() {
  return (
    <section id="philosophy" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-0">

        {/* Left — real Luxex about image */}
        <div className="relative order-2 lg:order-1">
          <div className="relative overflow-hidden" style={{ height: "100%", minHeight: 560 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/luxex/about.jpg"
              alt="Sanctuary"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay bottom card */}
            <div
              className="absolute bottom-0 right-0 p-8"
              style={{ background: C.white, maxWidth: 230 }}
            >
              <p style={label()}>Featured Sanctuary</p>
              <p className="mt-2" style={{ ...display("1.15rem", 400), color: C.darkAlt }}>Hacienda del Alma</p>
              <p className="mt-1" style={{ ...mono("0.72rem"), color: C.text }}>Nosara, Costa Rica</p>
            </div>
          </div>
        </div>

        {/* Right — copy */}
        <div className="order-1 lg:order-2 px-12 lg:px-16 py-20 flex flex-col justify-center" style={{ background: C.white }}>
          <SectionLabel>Our Philosophy</SectionLabel>
          <div className="w-20 my-5">
            <GoldDiamond />
          </div>

          <Display size="clamp(2.2rem, 4vw, 3.2rem)" weight={300}>
            The Art of the<br />
            <em style={{ fontStyle: "italic", fontWeight: 300, color: C.gold }}>Sacred Journey</em>
          </Display>

          <div className="mt-6 mb-5 h-px w-12" style={{ background: C.gold }} />

          <p className="mb-5" style={{ ...mono("0.95rem", 300), color: C.text, lineHeight: 1.9 }}>
            We believe the most profound transformations emerge when exceptional care meets exceptional
            setting. Every retreat is choreographed with the precision of a five-star experience —
            weaving ancient ceremonial wisdom with modern luxury.
          </p>
          <p className="mb-8" style={{ ...mono("0.95rem", 300), color: C.text, lineHeight: 1.9 }}>
            Our facilitators hold both deep ceremonial lineages and rigorous clinical credentials.
            Your privacy, safety, and transformation are held with the utmost reverence.
          </p>

          <div className="flex flex-col gap-4 mb-10">
            {[
              "Full psychiatric pre-screening & integration support",
              "World-class facilitators with clinical credentials",
              "Discreet, members-only access to every sanctuary",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-px flex-shrink-0" style={{ background: C.gold }} />
                <p style={{ ...mono("0.85rem", 400), color: C.text }}>{item}</p>
              </div>
            ))}
          </div>

          <div>
            <GoldBtn href="#experiences">
              Explore Experiences <ArrowRight className="w-3.5 h-3.5" />
            </GoldBtn>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Experience Cards — Luxex "rooms" style ─── */
const experiences = [
  {
    label: "Signature",
    title: "Psilocybin Immersion",
    location: "Costa Rica",
    duration: "7 Nights",
    price: "From $14,000",
    description: "Multi-ceremony journey in a private rainforest sanctuary. Daily integration circles, somatic therapy, and bespoke cuisine.",
    tag: "Most Sought After",
    img: "/luxex/room-1.jpg",
  },
  {
    label: "Rare",
    title: "Ayahuasca Odyssey",
    location: "Peru",
    duration: "10 Nights",
    price: "From $18,500",
    description: "Three ceremonies with a Shipibo lineage holder in the sacred Amazon. Breathwork, botanical medicine, and ancestral reconnection.",
    tag: null,
    img: "/luxex/room-2.jpg",
  },
  {
    label: "Exclusive",
    title: "Ketamine & Clarity",
    location: "Switzerland",
    duration: "5 Nights",
    price: "From $22,000",
    description: "Medically supervised ketamine-assisted therapy in a private alpine clinic. Precision dosing, neurofeedback, executive integration.",
    tag: "By Referral Only",
    img: "/luxex/room-3.jpg",
  },
  {
    label: "Introduction",
    title: "Microdose Mastery",
    location: "Tulum",
    duration: "4 Nights",
    price: "From $6,500",
    description: "Boutique introduction to intentional microdosing — breathwork, sound healing, and expert coaching in an oceanside setting.",
    tag: null,
    img: "/luxex/room-4.jpg",
  },
];

function ExperienceCard({ exp }: { exp: typeof experiences[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: C.white, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exp.img}
          alt={exp.title}
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />
        {/* Dark overlay on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-400"
          style={{ background: "rgba(0,0,0,0.25)", opacity: hovered ? 1 : 0 }}
        />
        {/* Tag */}
        {exp.tag && (
          <div
            className="absolute top-4 left-4 px-3 py-1"
            style={{ background: C.gold, ...mono("0.55rem", 700), textTransform: "uppercase", letterSpacing: "0.15em", color: C.white }}
          >
            {exp.tag}
          </div>
        )}
        {/* Location/Duration chip */}
        <div
          className="absolute bottom-4 right-4 px-3 py-1.5"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        >
          <p style={{ ...label("rgba(255,255,255,0.9)"), fontSize: "0.55rem" }}>{exp.location} · {exp.duration}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-7" style={{ borderBottom: `1px solid ${C.border}` }}>
        <p style={label()}>{exp.label}</p>
        <h3 className="mt-2 mb-1" style={{ ...display("1.65rem", 400), color: C.darkAlt }}>{exp.title}</h3>
        <p className="mb-4" style={{ ...mono("0.84rem", 300), color: C.text, lineHeight: 1.75 }}>{exp.description}</p>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <p style={{ ...display("1.25rem", 500), color: C.gold }}>{exp.price}</p>
          <a
            href="#contact"
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ ...label(hovered ? C.darkAlt : C.gold), fontSize: "0.6rem" }}
          >
            Inquire <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Experiences() {
  return (
    <section id="experiences" className="py-24" style={{ background: C.lightBg }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <SectionLabel>Curated Experiences</SectionLabel>
          <div className="max-w-xs mx-auto my-4"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>Choose Your Journey</Display>
          <p className="max-w-xl mx-auto mt-4" style={{ ...mono("0.92rem", 300), color: C.text, lineHeight: 1.85 }}>
            Each experience is carefully curated for depth, safety, and transformative impact.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px" style={{ background: C.border }}>
          {experiences.map((exp, i) => (
            <ExperienceCard key={i} exp={exp} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Parallax Quote Banner — Luxex parallax section ─── */
function QuoteBanner() {
  return (
    <div className="relative py-28 text-center overflow-hidden">
      {/* Real Luxex parallax bg image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/luxex/parallax-bg-1.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.65)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-8">
        <p style={{ ...display("4rem", 300, true), color: C.gold, lineHeight: 0.5 }}>&ldquo;</p>
        <p
          className="mt-4 mb-6"
          style={{ ...display("clamp(1.4rem, 3.5vw, 2.1rem)", 300, true), color: C.white, lineHeight: 1.65, letterSpacing: "0.03em" }}
        >
          The deepest healing does not happen despite luxury —<br />
          it happens <em style={{ color: C.gold, fontWeight: 400 }}>because</em> of it.
        </p>
        <div className="max-w-xs mx-auto mb-5"><GoldDiamond /></div>
        <p style={{ ...label("rgba(201,168,108,0.8)"), fontSize: "0.6rem" }}>— Founding Philosophy</p>
      </div>
    </div>
  );
}

/* ─── Amenities / Facilities — Luxex grid ─── */
const amenities = [
  { title: "Integration Support", sub: "Pre & Post-Journey", img: "/luxex/service-1.jpg" },
  { title: "Ceremonial Nutrition", sub: "Bespoke Cuisine", img: "/luxex/service-2.jpg" },
  { title: "Somatic Therapy", sub: "Body-Based Healing", img: "/luxex/service-3.jpg" },
  { title: "Private Transfers", sub: "First-Class Travel", img: "/luxex/spa.jpg" },
];

function Amenities() {
  return (
    <section className="py-24" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <SectionLabel>Included in Every Journey</SectionLabel>
          <div className="max-w-xs mx-auto my-4"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>The Luxury Standard</Display>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: C.border }}>
          {amenities.map((a, i) => (
            <AmenityCard key={i} {...a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AmenityCard({ title, sub, img }: { title: string; sub: string; img: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 280, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }} />
      <div className="absolute inset-0 transition-opacity duration-400" style={{ background: hovered ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.3)" }} />
      {/* Gold bottom bar on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-400" style={{ background: hovered ? C.gold : "transparent" }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
        <p style={{ ...label("rgba(201,168,108,0.9)"), marginBottom: 8 }}>{sub}</p>
        <p style={{ ...display("1.2rem", 400), color: C.white }}>{title}</p>
      </div>
    </div>
  );
}

/* ─── Destinations ─── */
const destinations = [
  { name: "Costa Rica", sub: "Rainforest Ceremony", img: "/luxex/facility-1.jpg" },
  { name: "Peru", sub: "Amazon Lineage", img: "/luxex/facility-2.jpg" },
  { name: "Switzerland", sub: "Alpine Precision", img: "/luxex/facility-3.jpg" },
  { name: "Tulum", sub: "Oceanside Ritual", img: "/luxex/facility-4.jpg" },
  { name: "Jamaica", sub: "Legal Psilocybin", img: "/luxex/pool.jpg" },
  { name: "Netherlands", sub: "Urban Sanctuary", img: "/luxex/spa.jpg" },
];

function Destinations() {
  return (
    <section id="retreats" className="py-24" style={{ background: C.lightBg }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <SectionLabel>Global Sanctuaries</SectionLabel>
          <div className="max-w-xs mx-auto my-4"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>Our Destinations</Display>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ background: C.border }}>
          {destinations.map((d, i) => (
            <DestCard key={i} {...d} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestCard({ name, sub, img }: { name: string; sub: string; img: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 240, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" style={{ transform: hovered ? "scale(1.07)" : "scale(1)" }} />
      <div className="absolute inset-0" style={{ background: hovered ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)" }} />

      {/* Gold corner frames on hover */}
      <div className="absolute top-5 left-5 w-9 h-9 transition-opacity duration-400" style={{ borderTop: `1px solid ${C.gold}`, borderLeft: `1px solid ${C.gold}`, opacity: hovered ? 1 : 0 }} />
      <div className="absolute bottom-5 right-5 w-9 h-9 transition-opacity duration-400" style={{ borderBottom: `1px solid ${C.gold}`, borderRight: `1px solid ${C.gold}`, opacity: hovered ? 1 : 0 }} />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
        <p style={{ ...label("rgba(201,168,108,0.85)"), marginBottom: 8 }}>{sub}</p>
        <h3 style={{ ...display("1.9rem", 300), color: C.white, textTransform: "uppercase", letterSpacing: "0.08em" }}>{name}</h3>
      </div>
    </div>
  );
}

/* ─── Facilitators ─── */
const facilitators = [
  { name: "Dr. Elena Vasquez", role: "Lead Facilitator · Psilocybin", credential: "MD · Clinical Psychologist · 14 Years", img: "/luxex/team-1.jpg" },
  { name: "Maestro Aurelio", role: "Shipibo Lineage · Ayahuasca", credential: "3rd Generation Curandero · 30 Years", img: "/luxex/team-2.jpg" },
  { name: "Dr. James Whitfield", role: "Medical Director · Ketamine", credential: "MD, Psychiatry · Johns Hopkins", img: "/luxex/team-3.jpg" },
];

function Facilitators() {
  return (
    <section id="facilitators" className="py-24" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <SectionLabel>Our Team</SectionLabel>
          <div className="max-w-xs mx-auto my-4"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>World-Class Facilitators</Display>
        </div>

        <div className="grid md:grid-cols-3 gap-px" style={{ background: C.border }}>
          {facilitators.map((f, i) => (
            <FacilitatorCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FacilitatorCard({ name, role, credential, img }: { name: string; role: string; credential: string; img: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ background: C.white, cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ height: 340 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-700" style={{ transform: hovered ? "scale(1.05)" : "scale(1)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: hovered ? C.gold : "transparent", transition: "background 0.3s" }} />
      </div>
      <div className="px-7 py-6 text-center" style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ ...display("1.3rem", 400), color: C.darkAlt }}>{name}</h3>
        <p className="mt-1.5 mb-2" style={{ ...label(), fontSize: "0.58rem" }}>{role}</p>
        <p style={{ ...mono("0.78rem", 300), color: C.text }}>{credential}</p>
      </div>
    </div>
  );
}

/* ─── Testimonials — dark section ─── */
const testimonials = [
  { quote: "I've stayed at the finest hotels on Earth. Nothing compares to the depth of care I experienced. The transformation I sought for decades happened in one week.", name: "A.R.", role: "Executive · New York", stars: 5 },
  { quote: "The discretion, the luxury, the expertise — all flawless. I arrived skeptical and left with a clarity I cannot put into words. My life has fundamentally changed.", name: "M.T.", role: "Entrepreneur · London", stars: 5 },
  { quote: "As a physician myself, I was deeply impressed by the medical rigor. The facilitators are truly world-class. This is how all healing should be conducted.", name: "Dr. S.L.", role: "Physician · Singapore", stars: 5 },
];

function Testimonials() {
  const [active, setActive] = useState(0);
  return (
    <section className="relative py-28 text-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "url(/luxex/parallax-bg-2.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(15,12,8,0.82)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-8">
        <SectionLabel light>Member Voices</SectionLabel>
        <div className="max-w-xs mx-auto my-5"><GoldDiamond /></div>
        <Display size="clamp(1.8rem, 4vw, 2.8rem)" weight={300} light>Transformations Shared</Display>

        <div className="mt-12">
          <div className="flex justify-center gap-1 mb-8">
            {Array.from({ length: testimonials[active].stars }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: C.gold }} />
            ))}
          </div>

          <p
            className="mb-8"
            style={{ ...display("clamp(1.1rem, 2.5vw, 1.4rem)", 300, true), color: "rgba(255,255,255,0.85)", lineHeight: 1.75, letterSpacing: "0.03em" }}
          >
            &ldquo;{testimonials[active].quote}&rdquo;
          </p>

          <div className="max-w-xs mx-auto mb-5"><GoldDiamond /></div>

          <p style={{ ...display("1rem", 500), color: C.white }}>{testimonials[active].name}</p>
          <p className="mt-1" style={{ ...label("rgba(201,168,108,0.7)"), fontSize: "0.58rem" }}>{testimonials[active].role}</p>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => setActive((active - 1 + testimonials.length) % testimonials.length)}
              className="w-9 h-9 flex items-center justify-center transition-colors"
              style={{ border: `1px solid rgba(201,168,108,0.4)`, color: C.gold, background: "transparent", cursor: "pointer" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="transition-all"
                  style={{ width: i === active ? 24 : 8, height: 2, background: i === active ? C.gold : "rgba(201,168,108,0.3)", border: "none", cursor: "pointer" }}
                />
              ))}
            </div>
            <button
              onClick={() => setActive((active + 1) % testimonials.length)}
              className="w-9 h-9 flex items-center justify-center transition-colors"
              style={{ border: `1px solid rgba(201,168,108,0.4)`, color: C.gold, background: "transparent", cursor: "pointer" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Process ─── */
const steps = [
  { num: "01", title: "Apply for Membership", body: "Submit a confidential application. We personally review each candidate for alignment with our community values." },
  { num: "02", title: "Clinical Screening", body: "A thorough medical and psychological evaluation with our clinical team to design the ideal journey for you." },
  { num: "03", title: "Design Your Journey", body: "Your dedicated concierge curates the perfect retreat — destination, timing, facilitator, and ceremonial modality." },
  { num: "04", title: "Integration Support", body: "Months of ongoing support after your journey, ensuring the insights gained become lasting transformation." },
];

function Process() {
  return (
    <section className="py-24" style={{ background: C.lightBg }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <SectionLabel>How It Works</SectionLabel>
          <div className="max-w-xs mx-auto my-4"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>The Member Journey</Display>
        </div>

        <div className="grid md:grid-cols-4 gap-px" style={{ background: C.border }}>
          {steps.map((s, i) => (
            <div key={i} className="p-8" style={{ background: C.white }}>
              <p style={{ ...display("4rem", 300), color: C.gold, lineHeight: 1, opacity: 0.25 }}>{s.num}</p>
              <div className="w-8 h-px my-5" style={{ background: C.gold }} />
              <h3 className="mb-3" style={{ ...display("1.1rem", 500), color: C.darkAlt, lineHeight: 1.4 }}>{s.title}</h3>
              <p style={{ ...mono("0.85rem", 300), color: C.text, lineHeight: 1.8 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact / Application ─── */
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    fontFamily: "Montserrat, sans-serif",
    fontWeight: 300,
    fontSize: "0.88rem",
    color: C.darkAlt,
    background: C.white,
    border: `1px solid ${C.border}`,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    ...label(),
    fontSize: "0.58rem",
    display: "block",
    marginBottom: "8px",
  };

  return (
    <section id="contact" className="py-24" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12 grid lg:grid-cols-2 gap-16 items-start">

        {/* Left — info */}
        <div>
          <SectionLabel>Exclusive Membership</SectionLabel>
          <div className="w-20 my-5"><GoldDiamond /></div>
          <Display size="clamp(2rem, 4vw, 3rem)" weight={300}>Begin Your<br /><em style={{ fontStyle: "italic", color: C.gold }}>Transformation</em></Display>

          <p className="mt-6 mb-10" style={{ ...mono("0.95rem", 300), color: C.text, lineHeight: 1.9 }}>
            Membership is by application only. We accept a limited number of new members each quarter
            to ensure every journey receives the personal attention it deserves.
          </p>

          <div className="flex flex-col gap-7">
            {[
              { Icon: Mail, label: "Email", value: "members@luxurypsychedelics.com" },
              { Icon: Phone, label: "Phone", value: "+1 (415) 000-0000 · By Appointment" },
              { Icon: MapPin, label: "Headquarters", value: "San Francisco, California" },
            ].map(({ Icon, label: l, value }, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: C.gold }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p style={{ ...mono("0.58rem", 700), textTransform: "uppercase", letterSpacing: "0.2em", color: C.text }}>{l}</p>
                  <p className="mt-1" style={{ ...mono("0.88rem", 400), color: C.darkAlt }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div>
          {sent ? (
            <div className="p-12 text-center" style={{ border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center" style={{ background: C.gold }}>
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 style={{ ...display("1.6rem", 400), color: C.darkAlt, marginBottom: 12 }}>Application Received</h3>
              <p style={{ ...mono("0.9rem", 300), color: C.text, lineHeight: 1.8 }}>
                Thank you. A member of our concierge team will reach out within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" style={{ padding: 40, border: `1px solid ${C.border}` }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "name", label: "Full Name", placeholder: "Your name", type: "text" },
                  { id: "email", label: "Email Address", placeholder: "you@example.com", type: "email" },
                ].map((f) => (
                  <div key={f.id}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} style={fieldStyle}
                      value={form[f.id as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={labelStyle}>Phone (Optional)</label>
                <input type="tel" placeholder="+1 (000) 000-0000" style={fieldStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              <div>
                <label style={labelStyle}>Experience of Interest</label>
                <select style={{ ...fieldStyle, cursor: "pointer" }}
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                >
                  <option value="">Select an experience...</option>
                  <option>Psilocybin Immersion · Costa Rica</option>
                  <option>Ayahuasca Odyssey · Peru</option>
                  <option>Ketamine & Clarity · Switzerland</option>
                  <option>Microdose Mastery · Tulum</option>
                  <option>Not sure — advise me</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Your Intentions</label>
                <textarea placeholder="Tell us a little about what brings you here..." rows={5}
                  style={{ ...fieldStyle, resize: "none" }}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 transition-all duration-300"
                style={{ ...mono("0.65rem", 700), textTransform: "uppercase", letterSpacing: "0.25em", background: C.gold, color: C.white, border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.darkAlt)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.gold)}
              >
                Submit Application
              </button>

              <p className="text-center" style={{ ...mono("0.7rem", 300), color: C.text }}>
                All applications are reviewed with complete confidentiality.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const cols = {
    Experiences: ["Psilocybin Retreats", "Ayahuasca Journeys", "Ketamine Therapy", "Microdosing Programs"],
    Company: ["About Us", "Our Facilitators", "Safety & Science", "Press"],
    Members: ["Apply for Membership", "Member Portal", "Integration Support", "Referral Program"],
  };

  return (
    <footer style={{ background: C.darkAlt }}>
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${C.gold} 30%, ${C.gold} 70%, transparent)` }} />

      <div className="max-w-7xl mx-auto px-8 lg:px-12 pt-16 pb-8">
        <div className="grid lg:grid-cols-4 gap-12 mb-14">
          <div>
            <div className="mb-6">
              <p style={{ ...mono("0.65rem", 800), textTransform: "uppercase", letterSpacing: "0.35em", color: C.white, marginBottom: 4 }}>Luxury</p>
              <p style={{ ...display("1.1rem", 300, true), color: C.gold, letterSpacing: "0.12em" }}>Psychedelics</p>
            </div>
            <p style={{ ...mono("0.82rem", 300), color: "rgba(255,255,255,0.35)", lineHeight: 1.85, maxWidth: 220 }}>
              Private psychedelic retreats conducted in settings of uncompromising luxury.
            </p>
          </div>

          {Object.entries(cols).map(([cat, links]) => (
            <div key={cat}>
              <p style={{ ...label(), marginBottom: "1.25rem" }}>{cat}</p>
              <div className="flex flex-col gap-3">
                {links.map((l) => (
                  <FooterLink key={l}>{l}</FooterLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ ...mono("0.58rem", 400), textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Luxury Psychedelics™ · All Rights Reserved
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Medical Disclaimer"].map((l) => (
              <FooterLink key={l} small>{l}</FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#"
      style={{ ...mono(small ? "0.58rem" : "0.82rem", small ? 500 : 300), textTransform: small ? "uppercase" : "none", letterSpacing: small ? "0.15em" : "0.02em", color: hovered ? C.gold : "rgba(255,255,255,0.35)", transition: "color 0.2s", textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
}

/* ─── Page ─── */
export default function LuxuryPsychedelicsPage() {
  return (
    <>
      <VideoIntro />
      <Nav />
      <Hero />
      <About />
      <Experiences />
      <QuoteBanner />
      <Amenities />
      <Destinations />
      <Facilitators />
      <Testimonials />
      <Process />
      <Contact />
      <Footer />
    </>
  );
}
