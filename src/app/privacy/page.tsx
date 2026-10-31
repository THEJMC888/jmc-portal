import type { Metadata } from "next";

// DRAFT for Robert's review. Not linked from the portal yet.
// Confirm the contact address, processors and region before linking it.

export const metadata: Metadata = {
  title: "Privacy | The Journeymen Collective™",
  description: "How the member portal protects and handles your information.",
};

const H2: React.CSSProperties = { fontFamily: "Syne, system-ui, sans-serif", fontWeight: 600, fontSize: "1.05rem", color: "#C29F60", letterSpacing: "0.06em", margin: "2.2rem 0 0.7rem" };
const P: React.CSSProperties = { fontFamily: "Lora, Georgia, serif", fontSize: "0.98rem", lineHeight: 1.85, color: "rgba(222,211,200,0.82)", margin: "0 0 0.9rem" };
const LI: React.CSSProperties = { ...P, margin: "0 0 0.5rem" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12 md:py-20" style={{ background: "#03091c" }}>
      <article className="mx-auto" style={{ maxWidth: 720 }}>
        <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C29F60" }}>
          Member Portal
        </p>
        <h1 style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: "clamp(1.8rem, 5vw, 2.4rem)", color: "#DED3C8", margin: "0.4rem 0 0.4rem" }}>
          Your Privacy
        </h1>
        <p style={{ ...P, fontSize: "0.85rem", color: "rgba(222,211,200,0.5)" }}>Last updated 31 October 2026</p>

        <p style={P}>
          The work you do in the portal is personal. We built it so that your private reflections stay yours, in the spirit of the Swiss Federal Act on Data Protection and the European General Data Protection Regulation.
        </p>

        <h2 style={H2}>What only you can read</h2>
        <p style={P}>
          Your journal (including photos and recordings), your statements, vision videos, attunement cards and blueprint are encrypted on your own device before they are saved. The key that opens them is created on your device and protected by your password and by a 24 word recovery phrase that only you hold. We store sealed copies only. No one at The Journeymen Collective, and none of our service providers, can read them.
        </p>
        <p style={P}>
          Your password never leaves your device in a form that could open your content. Because of this, if you forget your password and lose your recovery phrase, we cannot recover your encrypted content for you.
        </p>

        <h2 style={H2}>What we can see</h2>
        <ul style={{ paddingLeft: "1.2rem" }}>
          <li style={LI}>Your name and email address, and when you were invited and last signed in.</li>
          <li style={LI}>The date of each journal entry and the size and timing of your encrypted items, but not what they contain.</li>
          <li style={LI}>Your course access and which meditations and courses are available to you.</li>
          <li style={LI}>Notes from your coaching calls with us, which appear in My Journey. These are visible to you and to your coaches.</li>
        </ul>

        <h2 style={H2}>When something is sent unencrypted</h2>
        <p style={P}>
          Two optional features need to read your words to work. When you ask for an attunement card to be written for you, your statements and vision text are sent to our AI provider for that one request. When you transcribe a voice note, that recording is sent to our speech service for that one request. Neither is logged or stored by the portal, and both are only used when you press the button.
        </p>

        <h2 style={H2}>Who helps us run the portal</h2>
        <ul style={{ paddingLeft: "1.2rem" }}>
          <li style={LI}>Supabase, for sign in and for storing your sealed content.</li>
          <li style={LI}>Vercel, which hosts the portal.</li>
          <li style={LI}>Bunny.net, which delivers course videos and meditations.</li>
          <li style={LI}>Anthropic, for writing attunement cards when you ask.</li>
          <li style={LI}>OpenAI, for transcribing voice notes when you ask.</li>
          <li style={LI}>Fireflies.ai, which records and summarises coaching calls.</li>
          <li style={LI}>Resend, which sends portal emails such as invitations.</li>
        </ul>
        <p style={P}>
          We do not use advertising, tracking or analytics services, and we never sell or share your information.
        </p>

        <h2 style={H2}>Cookies</h2>
        <p style={P}>
          The portal uses only the cookies needed to keep you signed in. Your device also keeps a local copy of your content so the portal works without a connection.
        </p>

        <h2 style={H2}>Your rights</h2>
        <ul style={{ paddingLeft: "1.2rem" }}>
          <li style={LI}>Access and portability: in Account Settings, Download My Data gives you everything you have in the portal.</li>
          <li style={LI}>Erasure: in Account Settings, Delete My Account permanently removes your account and every record we hold for you.</li>
          <li style={LI}>Correction: you can edit your content at any time, and we will correct your account details on request.</li>
          <li style={LI}>You may also contact the Swiss Federal Data Protection and Information Commissioner or your local data protection authority.</li>
        </ul>

        <h2 style={H2}>Keeping you safe</h2>
        <p style={P}>
          Content is sealed with AES 256 GCM using a key stretched from your password with Argon2id. Optional two factor sign in, and an optional sign out after a period of inactivity, are available in Account Settings.
        </p>

        <h2 style={H2}>Contact</h2>
        <p style={P}>
          The Journeymen Collective is responsible for your information. Write to us at rng@thejourneymencollective.com with any question or request.
        </p>
      </article>
    </main>
  );
}
