"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  NotebookPen, Plus, Mic, MicOff, Video, VideoOff,
  Upload, Play, Pause, Trash2, Check, X, ChevronLeft,
  FileText, Loader, Image, LayoutList, BookOpen,
} from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { supabase } from "@/lib/supabase";
import {
  getOrCreateKey, encryptText, decryptText, exportKeyAsBase64, importKeyFromBase64,
} from "@/lib/journalCrypto";

// ─── OpenAI API key (stored locally) ─────────────────────────────────────────
const OPENAI_KEY = "jmc_openai_key";
function getOpenAIKey(): string { try { return localStorage.getItem(OPENAI_KEY) ?? ""; } catch { return ""; } }
function setOpenAIKey(k: string) { try { localStorage.setItem(OPENAI_KEY, k); } catch {} }

async function whisperTranscribe(dataUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", new File([blob], `audio.${ext}`, { type: blob.type || "audio/webm" }));
  form.append("model", "whisper-1");
  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.text ?? "";
}

// ─── Live dictation hook (Web Speech API) ────────────────────────────────────
function useDictation(onWord: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (!supported) { alert("Live dictation requires Chrome or Edge."); return; }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join(" ");
      onWord(transcript + " ");
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); };
    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [listening, onWord, supported]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { listening, toggle, stop, supported };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface JournalMedia {
  id: string;
  type: "audio" | "video" | "image";
  name: string;
  dataUrl: string;
  duration: number; // seconds
  size: number;     // bytes
  createdAt: string;
}

interface JournalEntry {
  id: string;
  date: string;   // YYYY-MM-DD
  title: string;
  text: string;
  media: JournalMedia[];
  createdAt: string;
  updatedAt: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LIST_KEY = "jmc_journal_list";
const entryKey = (id: string) => `jmc_journal_${id}`;
const uid = () => Math.random().toString(36).slice(2, 11);
const today = () => new Date().toISOString().slice(0, 10);

function loadList(): { id: string; date: string; title: string; updatedAt: string }[] {
  try { return JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]"); } catch { return []; }
}
function loadEntry(id: string): JournalEntry | null {
  try { const r = localStorage.getItem(entryKey(id)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveEntry(entry: JournalEntry) {
  localStorage.setItem(entryKey(entry.id), JSON.stringify(entry));
  const list = loadList().filter((e) => e.id !== entry.id);
  list.unshift({ id: entry.id, date: entry.date, title: entry.title, updatedAt: entry.updatedAt });
  list.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}
function deleteEntry(id: string) {
  localStorage.removeItem(entryKey(id));
  localStorage.setItem(LIST_KEY, JSON.stringify(loadList().filter((e) => e.id !== id)));
}

// ─── Supabase sync helpers ────────────────────────────────────────────────────
async function syncToSupabase(entry: JournalEntry, userId: string, cryptoKey: CryptoKey | null) {
  const text = cryptoKey ? await encryptText(cryptoKey, entry.text) : entry.text;
  await supabase.from("journal_entries").upsert({
    id: entry.id,
    date: entry.date,
    title: entry.title,
    text,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    user_id: userId,
  });
}

async function deleteFromSupabase(id: string) {
  await supabase.from("journal_entries").delete().eq("id", id);
}

async function fetchFromSupabase(cryptoKey: CryptoKey | null): Promise<JournalEntry[]> {
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false });
  return Promise.all((data ?? []).map(async (row) => ({
    id: row.id,
    date: row.date,
    title: row.title,
    text: cryptoKey ? await decryptText(cryptoKey, row.text ?? "") : (row.text ?? ""),
    media: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })));
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function formatShortDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDur(s: number) {
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Shared depth styles ──────────────────────────────────────────────────────
const CARD_SHADOW = [
  "inset 0 3px 0 rgba(255,255,255,0.22)",
  "inset 0 1px 0 rgba(255,255,255,0.38)",
  "inset 2px 0 0 rgba(255,255,255,0.06)",
  "inset 0 -3px 8px rgba(0,0,0,0.55)",
  "inset -2px 0 5px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(0,0,0,0.90)","0 4px 0 rgba(0,0,0,0.75)","0 6px 0 rgba(0,0,0,0.58)",
  "0 8px 0 rgba(0,0,0,0.42)","0 10px 0 rgba(0,0,0,0.28)","0 12px 0 rgba(0,0,0,0.16)",
  "0 14px 0 rgba(0,0,0,0.08)","0 16px 0 rgba(0,0,0,0.04)",
  "0 20px 28px rgba(0,0,0,0.75)","0 38px 65px rgba(0,0,0,0.58)",
  "5px 0 16px rgba(0,0,0,0.45)","0 0 0 1px rgba(0,0,0,0.6)",
].join(", ");

const glassCard: React.CSSProperties = {
  background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  borderTop: "2px solid rgba(255,255,255,0.35)",
  borderLeft: "1px solid rgba(255,255,255,0.18)",
  borderRight: "1.5px solid rgba(194,159,96,0.15)",
  borderBottom: "1.5px solid rgba(140,145,155,0.5)",
  boxShadow: CARD_SHADOW,
};
const raisedBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  border: "none",
  color: "#08203A",
  boxShadow: [
    "inset 0 1px 0 rgba(240,220,170,0.4)",
    "inset 0 -2px 4px rgba(0,0,0,0.25)",
    "0 2px 0 rgba(20,12,0,0.85)","0 4px 0 rgba(20,12,0,0.65)",
    "0 6px 0 rgba(20,12,0,0.40)","0 8px 0 rgba(20,12,0,0.20)",
    "0 10px 20px rgba(0,0,0,0.60)","0 4px 30px rgba(194,159,96,0.25)",
  ].join(", "),
  cursor: "pointer",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
};
const ghostBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
  borderTop: "1.5px solid rgba(255,255,255,0.20)",
  borderLeft: "1px solid rgba(255,255,255,0.12)",
  borderRight: "1px solid rgba(0,0,0,0.18)",
  borderBottom: "1.5px solid rgba(100,105,115,0.45)",
  boxShadow: [
    "inset 0 2px 0 rgba(255,255,255,0.12)",
    "inset 0 -2px 6px rgba(0,0,0,0.35)",
    "0 2px 0 rgba(0,0,0,0.70)","0 4px 0 rgba(0,0,0,0.45)",
    "0 6px 0 rgba(0,0,0,0.22)","0 8px 12px rgba(0,0,0,0.50)",
  ].join(", "),
  cursor: "pointer",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
};

// ─── Word of the Day ─────────────────────────────────────────────────────────
const WORDS_OF_DAY = [
  {
    word: "Sovereignty",
    definition: "Supreme authority over oneself — the recognition that you are the author of your own life.",
    etymology: "From Latin superanus (above all) via Old French souverain. The root supra — 'over, above' — points not to dominion over others but to standing above reactive patterns, inherited conditioning, and unconscious programming.",
    quantum: "Quantum systems remain in superposition — all possibilities at once — until an observer collapses the wave function into a single reality. Sovereignty is the act of becoming that observer: the one whose conscious attention determines which version of reality crystallises.",
    metaphysical: "In esoteric tradition, sovereignty is the seat of the Higher Self — the I AM Presence that exists prior to all story, role, or circumstance. To claim sovereignty is to recognise that the soul is not subject to external creation; it is itself the creative intelligence choosing its experience.",
    prompt: "Where are you deferring your power to others? What would it look like to reclaim that authority today?",
  },
  {
    word: "Presence",
    definition: "The quality of being fully engaged with what is happening right now, without reservation.",
    etymology: "From Latin praesentia — prae (before) + esse (to be). To be present is literally to exist fully in the act of being. The word carries the sense of being 'before' what arises — prior to reaction, prior to story.",
    quantum: "The quantum Zeno effect demonstrates that consistent observation stabilises a quantum system, preventing it from shifting states. Your conscious presence holds your reality in focus — attention is not passive; it is the force that shapes what persists.",
    metaphysical: "The perennial tradition teaches that the Now is the only point of power — the singular location where creation actually occurs. Past and future are constructs of mind; all transformation, all healing, all true encounter happen only in the living present.",
    prompt: "What are you currently avoiding being present to? What becomes possible when you fully arrive in this moment?",
  },
  {
    word: "Integrity",
    definition: "The state of being whole and undivided — aligning your words, actions, and values as one.",
    etymology: "From Latin integritas — integer (untouched, whole). The same root gives us 'integrate' and 'integer.' Integrity literally means nothing has been removed, corrupted, or fragmented. You are the same person in every room.",
    quantum: "Quantum coherence is the state in which a system's components vibrate in perfect phase alignment, producing amplified, measurable effects. A person in integrity operates coherently — their energy is not scattered across competing stories but unified and potent.",
    metaphysical: "Ancient traditions describe the fragmented self as the source of all suffering. Integrity is the restoration of the inner temple — when thought, word, and deed are one, the soul becomes a clear channel through which higher intelligence can act in the world.",
    prompt: "Is there an area of your life where you are out of integrity? What would it take to restore it?",
  },
  {
    word: "Abundance",
    definition: "A state of more than enough — a mindset that recognises sufficiency as the foundation of generosity.",
    etymology: "From Latin abundantia — ab (from) + unda (wave). Abundance is the state of overflowing like a wave. The root image is water running over — not accumulated, but perpetually in motion and in excess.",
    quantum: "The quantum field is not empty space — it is a sea of infinite potential energy, what physicists call the zero-point field. Abundance is the natural ground state of reality; scarcity is a contracted perception that filters out what was always available.",
    metaphysical: "Universal law teaches that the universe operates from infinite supply — limitation exists only in consciousness. As above, so below: the inner experience of sufficiency opens the channels through which outer provision flows. Gratitude is the frequency of abundance.",
    prompt: "Where do you already experience abundance that you tend to overlook? How does gratitude shift your perception?",
  },
  {
    word: "Courage",
    definition: "The willingness to act in the presence of fear — not its absence, but movement through it.",
    etymology: "From Old French corage — coeur (heart). Courage is literally a heart-act, not a head-act. Medieval usage meant to speak what was in one's heart, even when dangerous. Bravery is physical; courage is moral — it is the heart's refusal to be silent.",
    quantum: "In quantum tunnelling, particles pass through barriers that classical physics says are impassable — not around them, but through them. Courage is the human equivalent: the willingness to move directly through the wall of fear rather than waiting for it to disappear.",
    metaphysical: "Spiritual traditions universally describe the heroic journey as a descent into what we fear most. Carl Jung called this the encounter with the shadow. Courage is the willingness to face what the ego would rather not see — and in facing it, to reclaim the energy trapped inside it.",
    prompt: "What courageous step have you been postponing? What is the cost of continuing to wait?",
  },
  {
    word: "Discernment",
    definition: "The ability to judge and perceive clearly — choosing what is true and worthy from what merely appears so.",
    etymology: "From Latin discernere — dis (apart) + cernere (to sift, separate). Discernment is the act of sifting apart what is genuine from what is counterfeit. The root cernere also gives us 'concern' and 'certain' — all words about the act of distinguishing.",
    quantum: "Quantum measurement involves distinguishing between states — the act of observation itself defines which reality becomes actual. Discernment is the conscious version of this: your attention is a measuring instrument, and what you focus on, you amplify into reality.",
    metaphysical: "In the Vedic tradition, viveka — discriminating wisdom — is considered the highest spiritual faculty. It is the capacity to distinguish the real from the unreal, the eternal from the transient. Without discernment, even spiritual experiences can become subtle traps.",
    prompt: "Where in your life do you need greater discernment right now? What has clouded your judgment?",
  },
  {
    word: "Resilience",
    definition: "The capacity to recover and adapt in the face of adversity, uncertainty, or significant challenge.",
    etymology: "From Latin resilire — re (back) + salire (to leap, jump). Resilience is the spring in a material that causes it to leap back to its original form after compression. The root image is not endurance but elasticity — returning, not merely withstanding.",
    quantum: "Quantum systems naturally return to their ground state — their lowest-energy, most stable configuration — after being disturbed. Resilience in humans mirrors this: after disruption, the system seeks coherence. The ground state of human consciousness is peace.",
    metaphysical: "The Tao Te Ching teaches that water, the softest substance, overcomes rock, the hardest — not by force but by persistence and adaptability. Resilience in the metaphysical sense is not about rigidity but about rootedness in something that cannot be disturbed: presence itself.",
    prompt: "Reflect on a time you recovered from something difficult. What did that reveal about who you are?",
  },
  {
    word: "Intention",
    definition: "A clear aim or purpose that precedes and shapes every action and decision you take.",
    etymology: "From Latin intentio — intendere (to stretch toward). Intention is a stretching of will toward a desired end. The same root gives us 'tense' and 'tension' — an intention is a state of directed inner tension that pulls future into the present.",
    quantum: "Research in quantum biology and consciousness studies suggests that directed intention influences measurable physical systems — from random number generators to plant growth. Dr. Emoto's water crystal research and Radin's mind-matter studies point to intention as a physically real force.",
    metaphysical: "Intention is the first act of creation in every mystical tradition. In the beginning was the Word — but before the Word came the will. Intention sets the vibrational signature of what follows; every structure in your life is the materialisation of a previous intention, whether conscious or not.",
    prompt: "What is the deepest intention behind what you are building right now? Does your daily behaviour reflect it?",
  },
  {
    word: "Gratitude",
    definition: "The recognition and appreciation of what is good — a practice that reshapes how reality presents itself.",
    etymology: "From Latin gratitudo — gratus (pleasing, thankful). The root gratus also gives us 'grace' and 'gratis.' Gratitude and grace share a common origin: both describe the experience of receiving something as gift rather than transaction.",
    quantum: "HeartMath Institute research demonstrates that gratitude shifts heart rate variability into coherent patterns — measurable states of physiological order that enhance cognitive performance and immune function. Gratitude is not merely emotional; it is a biological and energetic state.",
    metaphysical: "Mystics across traditions teach that gratitude is not a response to good fortune — it is the cause of it. When the soul genuinely appreciates what exists, it aligns with the creative force that produced it, and draws more of that force into expression. Gratitude is the posture of the open hand.",
    prompt: "List five things that are easy to overlook that you are genuinely grateful for. Sit with each one.",
  },
  {
    word: "Vulnerability",
    definition: "The willingness to be seen — to open yourself to uncertainty and emotional risk in service of connection.",
    etymology: "From Latin vulnerabilis — vulnus (wound). To be vulnerable is literally to be woundable — to have removed the armour that protects against hurt. The word does not imply weakness; it implies the courage to be open enough to be affected by life.",
    quantum: "In quantum field theory, particles are not solid objects but open systems in constant exchange with their environment. True connection requires permeability — the willingness to be in genuine exchange rather than defended transaction. Isolation is energetically costly; openness is the natural state of energy.",
    metaphysical: "Brené Brown's research aligns with ancient wisdom: vulnerability is not the opposite of strength but its birthplace. The wound (vulnus) is the very place where light enters. In Sufi poetry, the broken-open heart is described as the vessel most fit to receive divine love.",
    prompt: "Where have you been hiding or performing? What would you say if you allowed yourself to be fully seen?",
  },
  {
    word: "Legacy",
    definition: "The lasting impression you leave on people, places, and systems long after your direct involvement ends.",
    etymology: "From Latin legatum — legare (to send as ambassador, to bequeath). A legacy is what an ambassador leaves behind — not just property but a mission, a representation, a transmission of something entrusted to you that you now pass forward.",
    quantum: "Quantum entanglement demonstrates that particles, once connected, remain correlated across any distance and time. A life lived with purpose creates entanglements — bonds of influence that persist beyond physical presence. You are already entangled with everyone you have genuinely touched.",
    metaphysical: "Indigenous traditions speak of living for seven generations — considering how your choices ripple through those who have not yet arrived. Legacy in the metaphysical sense is not reputation but resonance: the quality of frequency you leave embedded in the people and places you moved through.",
    prompt: "If someone described your legacy today, what would they say? Is that the legacy you intend to leave?",
  },
  {
    word: "Discipline",
    definition: "The consistent practice of doing what is required, even when motivation has departed.",
    etymology: "From Latin disciplina — discere (to learn). The root of discipline is learning, not punishment. A disciple is one who submits to instruction — not because they are forced, but because they recognise the teacher's wisdom exceeds their own comfort.",
    quantum: "Neuroplasticity research shows that repeated neural activation strengthens synaptic connections through long-term potentiation — the brain literally rewires toward what is consistently practised. Discipline at the quantum level is the process of collapsing probability into habit.",
    metaphysical: "Every spiritual tradition offers a practice: a discipline that, followed faithfully, opens what casual effort cannot reach. The word 'ascesis' in Greek means training — the same word athletes used. Discipline is the agreement to submit to a process whose fruits you cannot yet taste, trusting the tradition that mapped the path.",
    prompt: "Where does your discipline serve you most? Where has its absence cost you? What needs restructuring?",
  },
  {
    word: "Clarity",
    definition: "A state of precise understanding — knowing exactly what you want, why you want it, and what it will require.",
    etymology: "From Latin claritas — clarus (clear, bright, renowned). Clarity is not merely the absence of fog but the presence of light. The root also gives us 'declare' — clarity compels articulation; when you truly see, you cannot remain silent about what you see.",
    quantum: "Laser light differs from ordinary light in one way: it is coherent — all photons in phase, moving in the same direction. An ordinary bulb scatters; a laser cuts through steel. Clarity is the coherent state of intention — when scattered thoughts align into a single directed beam.",
    metaphysical: "The mystic's path often begins not with answers but with the burning away of false certainties. Clarity in the deep sense is not knowing more — it is seeing through the constructs that obscure what was always present. It is the moment the lens is cleaned and the view sharpens to what is actually here.",
    prompt: "In which area of your life do you currently lack clarity? What would become possible if you found it?",
  },
  {
    word: "Trust",
    definition: "A confident reliance on the character, ability, or truth of someone or something — including yourself.",
    etymology: "From Old Norse traust — strength, confidence. Related to 'true' and 'tree' — both words rooted in the idea of something solid, upright, and enduring. Trust is an act of resting your weight on something believed to be structurally sound.",
    quantum: "The quantum measurement problem reveals that a system without an observer remains in superposition — all states equally possible. Trust is the willingness to step into that uncertainty without needing to collapse every variable first. It is the act of participating in reality before the outcome is guaranteed.",
    metaphysical: "Faith in all traditions is not belief in the absence of evidence — it is active trust in the intelligence behind the pattern. The mystic's 'dark night of the soul' is precisely the testing of trust when no outer evidence remains. Those who emerge describe trust not as a posture they maintained, but as the ground that held them.",
    prompt: "Do you trust yourself? Where has that trust been broken, and what would it take to rebuild it?",
  },
  {
    word: "Accountability",
    definition: "Taking full ownership of your choices and their consequences — without blame, excuse, or deflection.",
    etymology: "From Old French aconter — a (to) + conter (to count, recount). To be accountable is literally to give an account — to stand before an honest reckoning of what has occurred and own one's part in it. It is the willingness to be counted.",
    quantum: "In quantum mechanics, there is no observer-independent reality — the observer is always implicated in the result. Accountability mirrors this: there is no outcome in your life in which you played no part. To recognise this is not guilt but power — what you co-created, you can co-recreate.",
    metaphysical: "Karma is not punishment but the law of complete accounting — every cause produces its effect, and every effect can be traced to its cause. Accountability in the spiritual sense is not about self-judgment but about recognising your creative role in your experience, and exercising that role with greater wisdom.",
    prompt: "Where have you been avoiding accountability? What happens when you own it completely?",
  },
  {
    word: "Empathy",
    definition: "The capacity to understand and share the experience of another — the foundation of genuine connection.",
    etymology: "From Greek empatheia — en (in) + pathos (feeling, suffering). Empathy is literally being 'in the feeling' of another. The term was adopted in 1858 by German aestheticians — einfühlung, 'feeling-into' — to describe the experience of projecting oneself into a work of art.",
    quantum: "Mirror neurons, discovered in the 1990s, fire both when an action is performed and when it is observed — the brain rehearses the experience of another as if it were its own. At a quantum level, entangled systems share state; empathy may be the biological expression of the deeper interconnection quantum physics describes.",
    metaphysical: "The Vedantic concept of 'Tat Tvam Asi' — Thou Art That — holds that the perceived separation between self and other is the fundamental illusion. Empathy is a momentary dissolution of that illusion — a glimpse of the underlying unity in which another's joy and pain are recognised as not entirely other than your own.",
    prompt: "Who in your life needs to feel understood right now? What would it mean to truly listen?",
  },
  {
    word: "Vision",
    definition: "A vivid mental image of a desired future — the north star that gives direction and meaning to daily effort.",
    etymology: "From Latin visio — videre (to see). Vision shares its root with 'evident,' 'provide,' and 'prudent' — all words about seeing ahead or seeing clearly. A vision is not a wish but a seeing: the faculty of perceiving what has not yet materialised as though it already has.",
    quantum: "Quantum mechanics demonstrates that the future is not fixed — it exists as a probability distribution that collapses toward particular outcomes based on present conditions. Vision is the act of intentionally conditioning the present — loading the probability field — toward a preferred future.",
    metaphysical: "Prophets and visionaries in every tradition did not predict the future — they perceived it. In the Hermetic view, time is not linear but holographic; all moments exist simultaneously, and the gifted seer learns to access what is already complete at a higher octave of reality. Your vision is a memory of where you are going.",
    prompt: "How alive is your vision right now? What would reconnecting to it fully change about how you are showing up?",
  },
  {
    word: "Stillness",
    definition: "The practice of internal quietude — creating space within the noise to hear what is most essential.",
    etymology: "From Old English stille — fixed, motionless, calm. Related to the German Stille and the concept of being 'stilled' — not dead but arrested, like a body of water that has ceased its turbulence and become reflective. Stillness is motion's perfect completion.",
    quantum: "Quantum systems at their ground state — their minimum energy — exhibit zero-point fluctuations: subtle, irreducible motion that underlies all apparent stillness. True stillness is not the absence of activity but attunement to the subtlest level of movement — the hum beneath the noise.",
    metaphysical: "The Psalms say 'Be still and know that I AM God.' Stillness in the mystical sense is not the cessation of thought but the dropping beneath it — into the awareness that precedes thinking. In that pre-conceptual space, the practitioner encounters what cannot be reached by effort: the ground of being itself.",
    prompt: "When did you last sit in true stillness? What arises when you stop moving long enough to hear yourself?",
  },
  {
    word: "Authenticity",
    definition: "The quality of being genuinely and fully yourself — unmasked by performance, approval, or expectation.",
    etymology: "From Greek authentikos — authentes (one who acts on their own authority). The root autos means 'self' — authenticity is self-authored action, as opposed to action driven by the scripts of others. The authentic person is the original, not the copy.",
    quantum: "In quantum information theory, no unknown quantum state can be perfectly copied — the 'no-cloning theorem.' You cannot be authentically replicated. Each consciousness is a unique configuration of the quantum field; authenticity is the act of expressing that unrepeatable signature rather than mimicking an existing one.",
    metaphysical: "The Sufi concept of the 'nafs al-safiyya' — the purified soul — describes authenticity as what remains when the accumulated layers of conditioning, fear, and persona are dissolved. Beneath performance is a self that needs no approval because it knows its own origin. Authenticity is proximity to that inner ground.",
    prompt: "Where are you performing a version of yourself rather than inhabiting it? What would full authenticity cost — and offer?",
  },
  {
    word: "Purpose",
    definition: "The animating reason beneath your existence — the deeper 'why' that makes suffering meaningful and effort sustainable.",
    etymology: "From Old French porpos — por (forth) + poser (to place). Purpose is that which is placed-forth — the aim set before you. The word shares its root with 'propose' and 'depose': to purpose something is to set it before you as that toward which all other movement is organised.",
    quantum: "Purpose functions like a strange attractor in chaos theory — a pattern that organises seemingly random events into a coherent trajectory. A life lived on purpose does not eliminate uncertainty; it gives every event, including difficulty, a context in which it becomes information rather than noise.",
    metaphysical: "Viktor Frankl, writing from Auschwitz, observed that those who survived possessed a sense of meaning — a why that bore almost any how. In the Vedic tradition, dharma — one's sacred duty and soul-path — is not chosen but discovered: it is the specific shape of your soul's assignment in this incarnation.",
    prompt: "If you had one year left, what would you devote it to? What does that reveal about your true purpose?",
  },
  {
    word: "Devotion",
    definition: "A sustained commitment to something larger than immediate comfort — the practice of consistent love in action.",
    etymology: "From Latin devotio — devovere (to vow, consecrate). To be devoted is to have made a vow — to have set apart a portion of your life as sacred to something beyond the self. Roman soldiers devoted their lives to the emperor; mystics devoted them to the divine.",
    quantum: "Sustained attention — a form of devotion — changes brain structure through neuroplasticity. What you consistently attend to expands; what you neglect contracts. Devotion is the sustained application of consciousness that literally reshapes the neural architecture through which you perceive and respond to reality.",
    metaphysical: "Bhakti — the yoga of devotion — is considered by many Hindu teachers the most direct path to the divine. The devoted heart bypasses the intellectual obstacles that block the mind. Devotion is not sentiment but orientation: the entire instrument of the self pointed consistently toward what it loves most.",
    prompt: "What are you devoted to in this season of your life? Is your devotion showing up in how you spend your time?",
  },
  {
    word: "Mastery",
    definition: "The result of sustained, deliberate practice — the transformation of effort into effortless excellence over time.",
    etymology: "From Old French maistre — Latin magister (master, chief, teacher). Mastery is not possession of a skill but the condition of being its teacher — having so thoroughly absorbed something that you can transmit it. The master has made the external internal.",
    quantum: "In quantum mechanics, a well-defined energy state is said to be an eigenstate — the most stable, self-consistent configuration a system can occupy. Mastery is the human eigenstate: the point at which skill and self are indistinguishable, and performance flows from identity rather than effort.",
    metaphysical: "The Zen tradition speaks of beginner's mind — the paradox that the greatest masters are those who have returned to openness. Mastery does not close the door on mystery; it opens it. The master has not accumulated techniques but shed the resistance that prevented the skill from moving freely through them.",
    prompt: "What craft or skill calls for deeper mastery from you? What would it look like to commit to it fully?",
  },
  {
    word: "Surrender",
    definition: "The conscious release of what you cannot control — not weakness, but wisdom in the face of what is.",
    etymology: "From Old French surrendre — sur (over) + rendre (to give back, render). To surrender is to give back what was never truly yours to keep. The word implies not defeat but the recognition of a higher claim — returning what was held in trust.",
    quantum: "The quantum concept of decoherence describes how systems entangled with their environment lose their isolated identity and become part of a larger whole. Surrender is the human experience of this: the release of the insistence on a separate, controlled self, and the discovery of what is possible in that expanded state.",
    metaphysical: "Every mystical tradition identifies the ego's need for control as the primary obstacle to grace. The Sufi concept of fana — annihilation of the self — and the Christian 'thy will be done' both describe the same movement: the conscious release of the personal will into a larger intelligence. What is surrendered does not disappear — it is transfigured.",
    prompt: "What are you holding on to that is not yours to carry? What becomes available when you release it?",
  },
  {
    word: "Wisdom",
    definition: "The synthesis of experience, reflection, and truth — knowing not only what to do but when and why.",
    etymology: "From Old English wīsdōm — wīs (wise) + dōm (judgment, condition). Wisdom is not merely knowledge but the condition of being wise — a state of being, not just a possession. The root wīs connects to 'see' — wisdom is, at its core, the capacity to see clearly.",
    quantum: "Classical information is data; quantum information includes the context and the observer. Wisdom is the quantum version of intelligence — it does not just process information but holds the relationship between the information, the context, and the consciousness receiving it. Wisdom is information in its full entangled state.",
    metaphysical: "Sophia — divine wisdom — appears across Greek, Gnostic, Kabbalistic, and Christian mystical traditions as a feminine principle of the divine intelligence that underlies creation. Wisdom in the metaphysical sense is not acquired from outside but uncovered from within — it is the soul's original nature, recovered through experience.",
    prompt: "What is the wisest piece of counsel you carry right now? Are you applying it to your own life?",
  },
  {
    word: "Humility",
    definition: "An accurate assessment of your own strengths and limitations — the foundation of continued growth.",
    etymology: "From Latin humilitas — humus (earth, ground). Humility is groundedness — being of the earth, close to what is real and foundational. The root image is not self-deprecation but soil: the humble person is grounded, fertile, receptive. Things grow in humble soil.",
    quantum: "The uncertainty principle teaches that the more precisely you know one property of a particle, the less you can know another. Knowledge always comes at the cost of certainty elsewhere. Humility is the experiential understanding of this: the more you genuinely know, the more you understand how much remains unknown.",
    metaphysical: "Every spiritual tradition guards its deepest teaching behind humility — not as a gatekeeping device, but because the inflated ego cannot receive what is too subtle to be grasped. The Sufi teacher Rumi described the self as a flute only capable of music when it has been emptied. Humility is the emptying.",
    prompt: "Where has pride or ego recently blocked your learning? What would humility open up right now?",
  },
  {
    word: "Creation",
    definition: "The act of bringing something new into existence — the fundamental expression of human will and imagination.",
    etymology: "From Latin creatio — creare (to make, produce). The root connects to 'crescere' (to grow) — creation is not manufacture from nothing but the cultivation of what is latent into what is actual. The creator is the one who causes potential to grow into form.",
    quantum: "Quantum field theory describes a vacuum that is not empty but seething with virtual particles — all possible forms in constant potential. Creation, in the quantum sense, is the collapse of possibility into actuality. Every creative act is a localised version of the same process by which the universe perpetually brings itself into being.",
    metaphysical: "In nearly every creation cosmology, the world emerges from a divine creative act — the Word, the sound, the light. Humans, made in that image, carry the same creative capacity at a smaller scale. The Hermetic axiom 'as above, so below' applies most powerfully here: you are a universe creating itself from the inside out.",
    prompt: "What are you currently in the process of creating? What is trying to be born through you right now?",
  },
  {
    word: "Boundaries",
    definition: "Clearly communicated limits that honour your values, energy, and sense of self — acts of self-respect.",
    etymology: "From Old French bounde — Medieval Latin bodina (landmark, boundary marker). A boundary is literally a marker — a stone placed in the earth to indicate where one domain ends and another begins. It is not a wall but a declaration: this is mine; this is yours.",
    quantum: "Phase boundaries in physics are the zones where one state of matter transitions to another — where liquid becomes gas, or solid becomes liquid. These boundaries are not walls but zones of transformation. Human boundaries similarly define not merely limits but the conditions under which transformation is possible.",
    metaphysical: "The sacred in many traditions is always bounded — a sanctuary has walls, a ritual has a circle, a temple has a threshold. Boundaries create the container within which something precious can be held and developed. Without a container, energy dissipates. A life without boundaries is like a river without banks — not freer, but formless.",
    prompt: "Where do you need to establish or reinforce a boundary? What has it cost you not to?",
  },
  {
    word: "Momentum",
    definition: "The forward energy created by consistent aligned action — the compound interest of showing up.",
    etymology: "From Latin momentum — movere (to move). Momentum is the measure of motion — specifically, the quality of motion that resists being stopped. The same root gives us 'moment' — the smallest unit of time that still contains movement.",
    quantum: "In quantum mechanics, the momentum of a particle is related to its wave's frequency — higher momentum means shorter wavelength and more precise location. Momentum in a human life produces clarity: the more consistently you move in a direction, the more precisely your location in that field becomes defined.",
    metaphysical: "Newton's first law — an object in motion tends to remain in motion — applies as much to consciousness as to physics. Every spiritual tradition recognises the importance of maintaining the current of practice, devotion, or effort. The hardest moment is the first; once momentum is established, the path carries you forward as much as you carry it.",
    prompt: "Where does positive momentum exist in your life right now? How can you feed it rather than interrupt it?",
  },
  {
    word: "Commitment",
    definition: "A binding resolution to a course of action — the decision made once so it doesn't have to be made again.",
    etymology: "From Latin committere — com (together) + mittere (to send). Commitment is sending yourself forward together with something — a pledge, a person, a direction. To commit is to put yourself in motion toward something and bind the journey.",
    quantum: "In quantum mechanics, measurement collapses the probability wave into a single actuality — the infinite becomes particular. Commitment is the human act of conscious collapse: choosing one path from among all possible paths, and concentrating all available energy there. Indecision is perpetual superposition; commitment is the act of becoming real.",
    metaphysical: "The universe is said to conspire on behalf of commitment — Goethe wrote that the moment one definitely commits, providence moves too. This is not superstition but the recognition that full commitment restructures attention, energy, and relational field in ways that produce radically different conditions than half-measures ever could.",
    prompt: "What are you only half-committed to? What would full commitment look like — and what does it require?",
  },
  {
    word: "Reverence",
    definition: "A deep respect and sense of wonder for what is sacred — the quality that transforms ordinary moments into meaningful ones.",
    etymology: "From Latin revereri — re (intensifier) + vereri (to feel awe, to respect). Reverence is intensified awe — the experience of being in the presence of something whose value exceeds your capacity to fully comprehend it. The root connects to 'aware' and 'wary': reverence is a form of heightened, careful attention.",
    quantum: "The wave function in quantum mechanics contains all possibilities simultaneously — a magnitude of potential that cannot be directly observed without being changed by observation. Reverence is the posture of approaching such magnitude: standing before what is larger than your frameworks, willing to be changed by the encounter.",
    metaphysical: "Rudolf Steiner described reverence as the first step of esoteric training: before any knowledge can be received, the soul must cultivate the capacity to be in the presence of the sacred without grasping or reducing it. Reverence is not passive awe but active receptivity — the open hand extended toward what cannot be demanded, only received.",
    prompt: "What in your life deserves more reverence than you are currently giving it? How might that shift how you inhabit it?",
  },
];

function getWordOfDay() {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return WORDS_OF_DAY[seed % WORDS_OF_DAY.length];
}

const PERSPECTIVE_LABELS = [
  { key: "etymology" as const, label: "Etymology", color: "rgba(194,159,96,0.7)" },
  { key: "quantum" as const, label: "Quantum", color: "rgba(0,200,240,0.7)" },
  { key: "metaphysical" as const, label: "Metaphysical", color: "rgba(180,140,255,0.7)" },
];

function WordOfDayCard({ sidebarMode = false, initialOpen }: { sidebarMode?: boolean; initialOpen?: boolean }) {
  const word = getWordOfDay();
  const [open, setOpen] = useState(initialOpen ?? !sidebarMode);

  const cardStyle: React.CSSProperties = sidebarMode
    ? {
        background: "linear-gradient(160deg, rgba(0,200,240,0.06) 0%, rgba(4,12,40,0.5) 100%)",
        borderTop: "1px solid rgba(0,200,240,0.2)",
        borderLeft: "1px solid rgba(0,200,240,0.1)",
        borderRight: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.3)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 10px rgba(0,0,0,0.35)",
        borderRadius: 8,
        marginBottom: 8,
        overflow: "hidden",
      }
    : {
        background: "linear-gradient(160deg, rgba(0,200,240,0.08) 0%, rgba(4,15,50,0.45) 50%, rgba(2,8,28,0.6) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1.5px solid rgba(0,200,240,0.3)",
        borderLeft: "1px solid rgba(0,200,240,0.15)",
        borderRight: "1px solid rgba(0,0,0,0.2)",
        borderBottom: "1.5px solid rgba(0,0,0,0.45)",
        boxShadow: [
          "inset 0 2px 0 rgba(255,255,255,0.12)",
          "inset 0 1px 0 rgba(0,200,240,0.15)",
          "inset 0 -3px 10px rgba(0,0,0,0.4)",
          "0 4px 0 rgba(0,0,0,0.7)", "0 8px 0 rgba(0,0,0,0.45)",
          "0 12px 0 rgba(0,0,0,0.22)", "0 16px 0 rgba(0,0,0,0.1)",
          "0 20px 32px rgba(0,0,0,0.6)",
        ].join(", "),
        borderRadius: 14,
        marginBottom: 32,
        overflow: "hidden",
        position: "relative" as const,
      };

  return (
    <div style={cardStyle}>
      {!sidebarMode && (
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.5), transparent)" }} />
      )}

      {/* Always-visible header — word + toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "none", border: "none",
          padding: sidebarMode ? "10px 12px" : "24px 28px 16px",
          display: "flex", alignItems: sidebarMode ? "center" : "flex-start",
          justifyContent: "space-between", gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(0,200,240,0.72)", marginBottom: sidebarMode ? 3 : 8 }}>
            Word of the Day {!sidebarMode && `· ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
          </div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600, fontSize: sidebarMode ? 15 : 30, color: "#DED3C8", lineHeight: 1.1, textShadow: sidebarMode ? "none" : "0 2px 16px rgba(0,0,0,0.5)" }}>
            {word.word}
          </div>
        </div>
        <div style={{
          fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
          color: "rgba(0,200,240,0.5)", letterSpacing: "0.12em", flexShrink: 0,
          marginTop: sidebarMode ? 0 : 8,
        }}>
          {open ? "▲ Hide" : "▼ Explore"}
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <div style={{ padding: sidebarMode ? "0 12px 12px" : "0 28px 24px" }}>
          {/* Definition */}
          <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: sidebarMode ? 11 : 13, color: "rgba(222,211,200,0.62)", lineHeight: 1.7, marginBottom: 16, paddingLeft: 10, borderLeft: "2px solid rgba(0,200,240,0.25)" }}>
            {word.definition}
          </p>

          {/* Three perspectives */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {PERSPECTIVE_LABELS.map(({ key, label, color }) => (
              <div key={key} style={{
                background: "rgba(0,0,0,0.22)",
                borderRadius: 8,
                padding: sidebarMode ? "10px 12px" : "14px 16px",
                borderTop: `1px solid ${color.replace("0.7", "0.15")}`,
                borderLeft: `2px solid ${color.replace("0.7", "0.35")}`,
                borderRight: "1px solid rgba(0,0,0,0.12)",
                borderBottom: "1px solid rgba(0,0,0,0.28)",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
              }}>
                <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color, marginBottom: 5 }}>
                  {label}
                </div>
                <p style={{ fontFamily: "Lora, Georgia, serif", fontSize: sidebarMode ? 11 : 12.5, color: "rgba(222,211,200,0.78)", lineHeight: 1.75, margin: 0 }}>
                  {word[key]}
                </p>
              </div>
            ))}
          </div>

          {/* Contemplation prompt */}
          <div style={{
            background: "rgba(0,200,240,0.05)",
            borderRadius: 7,
            padding: sidebarMode ? "10px 12px" : "13px 15px",
            borderTop: "1px solid rgba(0,200,240,0.12)",
            borderLeft: "1px solid rgba(0,200,240,0.08)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,200,240,0.5)", marginBottom: 5 }}>
              Contemplation Prompt
            </div>
            <p style={{ fontFamily: "Lora, Georgia, serif", fontSize: sidebarMode ? 11 : 13, color: "rgba(222,211,200,0.82)", lineHeight: 1.7, margin: 0 }}>
              {word.prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MediaRecorder hook ───────────────────────────────────────────────────────
function useRecorder(type: "audio" | "video") {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      const constraints = type === "audio" ? { audio: true } : { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const mimeType = type === "audio" ? "audio/webm" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      recorderRef.current = recorder;
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      console.error("Recorder error:", err);
      alert(`Could not access ${type === "audio" ? "microphone" : "camera"}. Please allow permission and try again.`);
    }
  }, [type]);

  const stop = useCallback((): Promise<{ dataUrl: string; duration: number; size: number; mimeType: string }> => {
    return new Promise((resolve) => {
      if (!recorderRef.current) return;
      if (timerRef.current) clearInterval(timerRef.current);
      const duration = elapsed;
      recorderRef.current.onstop = () => {
        const mimeType = type === "audio" ? "audio/webm" : "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          setState("idle");
          resolve({ dataUrl: reader.result as string, duration, size: blob.size, mimeType });
        };
        reader.readAsDataURL(blob);
      };
      recorderRef.current.stop();
    });
  }, [elapsed, type]);

  const cancel = useCallback(() => {
    if (recorderRef.current) { recorderRef.current.stop(); }
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("idle");
    setElapsed(0);
  }, []);

  return { state, elapsed, start, stop, cancel };
}

// ─── Media player ─────────────────────────────────────────────────────────────
function MediaPlayer({ item, onDelete, onTranscribe }: { item: JournalMedia; onDelete: () => void; onTranscribe?: () => Promise<void> }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const ref = useRef<HTMLAudioElement & HTMLVideoElement>(null);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };

  const handleTranscribe = async () => {
    if (!onTranscribe) return;
    setTranscribing(true);
    try { await onTranscribe(); } finally { setTranscribing(false); }
  };

  return (
    <div style={{
      ...glassCard,
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(to right, transparent, rgba(194,159,96,0.3), transparent)" }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: item.type === "audio"
            ? "linear-gradient(135deg, rgba(0,200,240,0.18), rgba(0,100,180,0.1))"
            : "linear-gradient(135deg, rgba(194,159,96,0.18), rgba(140,100,40,0.08))",
          border: item.type === "audio" ? "1px solid rgba(0,200,240,0.25)" : "1px solid rgba(194,159,96,0.25)",
          boxShadow: item.type === "audio" ? "0 0 10px rgba(0,180,220,0.15)" : "0 0 10px rgba(194,159,96,0.1)",
        }}>
          {item.type === "audio"
            ? <Mic size={12} color="#00d8ff" />
            : <Video size={12} color="#C29F60" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 11, fontWeight: 600, color: "#DED3C8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(222,211,200,0.45)", letterSpacing: "0.05em" }}>
            {formatDur(item.duration)} · {formatBytes(item.size)}
          </div>
        </div>
        <button
          onClick={toggle}
          style={{
            ...ghostBtn,
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, flexShrink: 0,
          }}
        >
          {playing ? <Pause size={11} color="#DED3C8" /> : <Play size={11} color="#DED3C8" style={{ marginLeft: 1 }} />}
        </button>
        {item.type === "audio" && onTranscribe && (
          <button
            onClick={handleTranscribe}
            disabled={transcribing}
            title="Transcribe to text"
            style={{
              background: transcribing ? "rgba(0,200,240,0.08)" : "none",
              border: transcribing ? "1px solid rgba(0,200,240,0.2)" : "none",
              borderRadius: 5,
              cursor: transcribing ? "default" : "pointer",
              padding: "2px 6px",
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 9,
              fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#00c8f0", opacity: transcribing ? 1 : 0.6,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { if (!transcribing) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { if (!transcribing) (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
          >
            {transcribing
              ? <><Loader size={10} style={{ animation: "spin 1s linear infinite" }} /> AI…</>
              : <><FileText size={10} /> Text</>}
          </button>
        )}
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0, opacity: 0.45, transition: "opacity 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}
        >
          <Trash2 size={12} color="#ff6b6b" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: item.type === "audio" ? "#00c8f0" : "#C29F60", borderRadius: 1, transition: "width 0.1s linear" }} />
      </div>

      {/* Hidden media element */}
      {item.type === "audio" ? (
        <audio
          ref={ref as React.RefObject<HTMLAudioElement>}
          src={item.dataUrl}
          onTimeUpdate={() => {
            if (ref.current && ref.current.duration) setProgress(ref.current.currentTime / ref.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          style={{ display: "none" }}
        />
      ) : (
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          src={item.dataUrl}
          controls
          onTimeUpdate={() => {
            if (ref.current && ref.current.duration) setProgress(ref.current.currentTime / ref.current.duration);
          }}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          style={{ width: "100%", borderRadius: 6, marginTop: 4, maxHeight: 200, objectFit: "cover" }}
        />
      )}
    </div>
  );
}

// ─── E2EE Key Management Modal ───────────────────────────────────────────────
function KeyManagementModal({
  cryptoKey,
  userId,
  onKeyImported,
  onClose,
}: {
  cryptoKey: CryptoKey | null;
  userId: string | null;
  onKeyImported: (key: CryptoKey) => void;
  onClose: () => void;
}) {
  const [exported, setExported] = useState<string | null>(null);
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    if (!cryptoKey) return;
    const b64 = await exportKeyAsBase64(cryptoKey);
    setExported(b64);
  };

  const handleCopy = async () => {
    if (!exported) return;
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  const handleImport = async () => {
    if (!userId || !importValue.trim()) return;
    setImportError("");
    const key = await importKeyFromBase64(importValue.trim(), userId);
    if (!key) {
      setImportError("Invalid key — must be a 44-character base64 string from a previous export.");
      return;
    }
    onKeyImported(key);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(2,12,30,0.55)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 7, padding: "10px 14px", color: "#DED3C8",
    fontFamily: "ui-monospace, monospace", fontSize: 11,
    outline: "none", boxSizing: "border-box",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)", wordBreak: "break-all",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(2,8,20,0.88)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: "linear-gradient(160deg, rgba(13,31,60,0.98) 0%, rgba(4,12,32,0.99) 100%)",
        borderTop: "1.5px solid rgba(255,255,255,0.14)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        borderRight: "1px solid rgba(0,0,0,0.3)",
        borderBottom: "1.5px solid rgba(0,0,0,0.5)",
        borderRadius: 14, boxShadow: "0 24px 80px rgba(0,0,0,0.85)",
        padding: "28px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.7)", marginBottom: 4 }}>
              🔒 End-to-End Encryption
            </div>
            <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 20, fontWeight: 600, color: "#DED3C8", margin: 0 }}>
              Journal Encryption Key
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.4)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(222,211,200,0.6)", lineHeight: 1.7, marginBottom: 20 }}>
          Your journal entries are encrypted in this browser before being stored. Supabase holds only ciphertext — unreadable without your key. Back up your key to access entries on other devices.
        </p>

        {/* Export */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", marginBottom: 8 }}>
            Export Key (Backup)
          </div>
          {!exported ? (
            <button onClick={handleExport} disabled={!cryptoKey} style={{
              padding: "9px 18px", borderRadius: 7, cursor: cryptoKey ? "pointer" : "not-allowed",
              fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              background: "rgba(29,116,88,0.15)", border: "1px solid rgba(29,116,88,0.3)",
              color: "rgba(110,231,183,0.85)", opacity: cryptoKey ? 1 : 0.5,
            }}>
              Reveal Key
            </button>
          ) : (
            <div>
              <div style={{ ...inputStyle, marginBottom: 8, userSelect: "all" as React.CSSProperties["userSelect"] }}>
                {exported}
              </div>
              <button onClick={handleCopy} style={{
                padding: "7px 14px", borderRadius: 6, cursor: "pointer",
                fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: copied ? "rgba(29,116,88,0.2)" : "rgba(194,159,96,0.1)",
                border: `1px solid ${copied ? "rgba(29,116,88,0.35)" : "rgba(194,159,96,0.25)"}`,
                color: copied ? "rgba(110,231,183,0.9)" : "rgba(194,159,96,0.85)",
              }}>
                {copied ? "✓ Copied" : "Copy to Clipboard"}
              </button>
              <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, color: "rgba(255,150,100,0.7)", marginTop: 8 }}>
                Save this somewhere safe (password manager). Anyone with this key can decrypt your journal.
              </p>
            </div>
          )}
        </div>

        {/* Import */}
        <div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,159,96,0.7)", marginBottom: 8 }}>
            Import Key (Restore on New Device)
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: "vertical", marginBottom: 8 }}
            value={importValue}
            onChange={e => setImportValue(e.target.value)}
            placeholder="Paste your exported key here…"
          />
          {importError && (
            <p style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, color: "rgba(255,100,80,0.8)", marginBottom: 8 }}>{importError}</p>
          )}
          <button onClick={handleImport} style={{
            padding: "9px 18px", borderRadius: 7, cursor: "pointer",
            fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            background: "rgba(0,180,200,0.1)", border: "1px solid rgba(0,180,200,0.25)",
            color: "rgba(0,210,230,0.85)",
          }}>
            Import &amp; Restore
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function JournalPage() {
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<{ id: string; date: string; title: string; updatedAt: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const [showList, setShowList] = useState(true); // mobile toggle
  const [viewMode, setViewMode] = useState<"list" | "feed">("list");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioRec = useRecorder("audio");
  const videoRec = useRecorder("video");
  const audioUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const [e2eeReady, setE2eeReady] = useState(false);
  const [showKeyExport, setShowKeyExport] = useState(false);

  useEffect(() => {
    setMounted(true);
    setList(loadList());
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      userIdRef.current = user.id;

      // Initialise encryption key (generates once, persists in IndexedDB)
      const key = await getOrCreateKey(user.id);
      cryptoKeyRef.current = key;
      setE2eeReady(true);

      fetchFromSupabase(key).then(async (remoteEntries) => {
        const remoteMap = new Map(remoteEntries.map((e) => [e.id, e]));
        // Pull remote → local (remote wins if newer)
        remoteEntries.forEach((remote) => {
          const local = loadEntry(remote.id);
          if (!local || remote.updatedAt > local.updatedAt) {
            saveEntry({ ...remote, media: local?.media ?? [] });
          }
        });
        // Push local → remote (entries not yet in Supabase)
        const localList = loadList();
        for (const item of localList) {
          if (!remoteMap.has(item.id)) {
            const entry = loadEntry(item.id);
            if (entry) await syncToSupabase(entry, user.id, key).catch(() => {});
          }
        }
        setList(loadList());
      }).catch(() => {});
    });
  }, []);

  const openEntry = useCallback((id: string) => {
    const e = loadEntry(id);
    if (e) { setActiveId(id); setEntry(e); if (isMobile) setShowList(false); }
  }, [isMobile]);

  const createEntry = useCallback(() => {
    const newEntry: JournalEntry = {
      id: uid(), date: today(), title: "", text: "", media: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    saveEntry(newEntry);
    setList(loadList());
    setActiveId(newEntry.id);
    setEntry(newEntry);
    if (isMobile) setShowList(false);
  }, [isMobile]);

  const persistEntry = useCallback((updated: JournalEntry) => {
    const e = { ...updated, updatedAt: new Date().toISOString() };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveEntry(e);
      setList(loadList());
      syncToSupabase(e, userIdRef.current ?? "", cryptoKeyRef.current).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
    setEntry(e);
  }, []);

  // Append text to notes — defined after persistEntry
  const appendToNotes = useCallback((text: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, text: prev.text + text };
      persistEntry(updated);
      return updated;
    });
  }, [persistEntry]);

  const dictation = useDictation(appendToNotes);

  const handleTranscribeClip = useCallback(async (item: JournalMedia) => {
    let key = getOpenAIKey();
    if (!key) {
      key = (prompt("Enter your OpenAI API key to transcribe audio.\nIt will be saved locally and never leave your browser.") ?? "").trim();
      if (!key) return;
      setOpenAIKey(key);
    }
    try {
      const text = await whisperTranscribe(item.dataUrl, key);
      appendToNotes(`\n\n[Transcript — ${item.name}]\n${text}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Transcription failed: ${msg}`);
      if (msg.includes("401") || msg.toLowerCase().includes("invalid")) setOpenAIKey("");
    }
  }, [appendToNotes]);

  const updateField = (field: "title" | "text", value: string) => {
    if (!entry) return;
    persistEntry({ ...entry, [field]: value });
  };

  const addMedia = (item: JournalMedia) => {
    if (!entry) return;
    persistEntry({ ...entry, media: [...entry.media, item] });
  };

  const removeMedia = (mediaId: string) => {
    if (!entry) return;
    persistEntry({ ...entry, media: entry.media.filter((m) => m.id !== mediaId) });
  };

  const handleDeleteEntry = () => {
    if (!activeId || !confirm("Delete this journal entry?")) return;
    deleteEntry(activeId);
    deleteFromSupabase(activeId).catch(() => {});
    setList(loadList());
    setActiveId(null);
    setEntry(null);
    if (isMobile) setShowList(true);
  };

  // ── Audio recording ──
  const handleAudioRecord = async () => {
    if (audioRec.state === "idle") {
      await audioRec.start();
    } else {
      const result = await audioRec.stop();
      addMedia({
        id: uid(), type: "audio",
        name: `Audio ${new Date().toLocaleTimeString()}`,
        dataUrl: result.dataUrl, duration: result.duration,
        size: result.size, createdAt: new Date().toISOString(),
      });
    }
  };

  // ── Video recording ──
  const handleVideoRecord = async () => {
    if (videoRec.state === "idle") {
      await videoRec.start();
    } else {
      const result = await videoRec.stop();
      addMedia({
        id: uid(), type: "video",
        name: `Video ${new Date().toLocaleTimeString()}`,
        dataUrl: result.dataUrl, duration: result.duration,
        size: result.size, createdAt: new Date().toISOString(),
      });
    }
  };

  // ── File upload ──
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "audio" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("File too large (max 50 MB). Try a shorter clip."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const media: JournalMedia = {
        id: uid(), type,
        name: file.name,
        dataUrl: reader.result as string,
        duration: 0, size: file.size,
        createdAt: new Date().toISOString(),
      };
      addMedia(media);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Photo upload ──
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) { alert(`${file.name} is too large (max 20 MB).`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        addMedia({
          id: uid(), type: "image",
          name: file.name,
          dataUrl: reader.result as string,
          duration: 0, size: file.size,
          createdAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  if (!mounted) return null;

  const isRecordingAudio = audioRec.state === "recording";
  const isRecordingVideo = videoRec.state === "recording";

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", flexDirection: "column" }}>

      {/* ── E2EE Key Management Modal ── */}
      {showKeyExport && (
        <KeyManagementModal
          cryptoKey={cryptoKeyRef.current}
          userId={userIdRef.current}
          onKeyImported={(newKey) => { cryptoKeyRef.current = newKey; }}
          onClose={() => setShowKeyExport(false)}
        />
      )}

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", flexShrink: 0, zIndex: 10, flexWrap: "wrap", rowGap: 8,
        position: "relative",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(4,10,32,0.3) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), rgba(194,159,96,0.3), transparent)" }} />

        {isMobile && !showList && (
          <button onClick={() => setShowList(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.6)", padding: "2px 4px", display: "flex" }}>
            <ChevronLeft size={18} />
          </button>
        )}

        <NotebookPen size={16} color="#00c8f0" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#DED3C8", letterSpacing: "0.04em" }}>
            Journal
          </div>
          <div style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10, color: "rgba(0,200,240,0.8)" }}>
            {list.length} {list.length === 1 ? "entry" : "entries"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, fontWeight: 600, color: "#4ade80", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 4, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <Check size={11} /> Saved
          </div>
        )}
        {/* E2EE lock badge + key export */}
        <button
          onClick={() => setShowKeyExport(v => !v)}
          title={e2eeReady ? "End-to-end encrypted — click to manage key" : "Encryption key not available (private window?)"}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px", borderRadius: 5, cursor: "pointer",
            fontFamily: "Syne, system-ui, sans-serif", fontSize: 9.5, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            background: e2eeReady ? "rgba(29,116,88,0.12)" : "rgba(255,100,60,0.1)",
            border: `1px solid ${e2eeReady ? "rgba(29,116,88,0.3)" : "rgba(255,100,60,0.25)"}`,
            color: e2eeReady ? "rgba(110,231,183,0.85)" : "rgba(255,150,100,0.8)",
          }}
        >
          {e2eeReady ? "🔒" : "⚠️"} E2EE
        </button>
        {/* Feed / List toggle */}
        <button
          onClick={() => setViewMode((m) => m === "list" ? "feed" : "list")}
          title={viewMode === "list" ? "Blog feed view" : "List view"}
          style={{
            ...ghostBtn,
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 12px", borderRadius: 7,
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            color: viewMode === "feed" ? "#C29F60" : "rgba(222,211,200,0.6)",
          }}
        >
          {viewMode === "list" ? <><BookOpen size={12} /> Feed</> : <><LayoutList size={12} /> List</>}
        </button>
        <button
          onClick={createEntry}
          style={{
            ...raisedBtn,
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 7,
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <Plus size={13} /> New Entry
        </button>
      </header>

      {/* ── Feed view ── */}
      {viewMode === "feed" && (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "36px 44px", maxWidth: 860, margin: "0 auto", width: "100%" }}>
          <WordOfDayCard />
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <NotebookPen size={32} color="rgba(0,200,240,0.2)" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.35)" }}>
                No entries yet. Tap &ldquo;New Entry&rdquo; to begin.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {list.map((item) => {
                const fullEntry = loadEntry(item.id);
                if (!fullEntry) return null;
                const photos = fullEntry.media.filter((m) => m.type === "image");
                return (
                  <article key={item.id} style={{
                    ...glassCard,
                    borderRadius: 16,
                    padding: "28px 32px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                    onClick={() => { setViewMode("list"); openEntry(item.id); }}
                  >
                    <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.35), transparent)" }} />
                    <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00c8f0", marginBottom: 8 }}>
                      {formatDate(item.date)}
                    </div>
                    <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", marginBottom: 16, lineHeight: 1.2 }}>
                      {fullEntry.title || <span style={{ fontStyle: "italic", opacity: 0.45 }}>Untitled</span>}
                    </h2>
                    {fullEntry.text && (
                      <p style={{ fontFamily: "Lora, Georgia, serif", fontSize: 14, color: "rgba(222,211,200,0.8)", lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: photos.length ? 20 : 0 }}>
                        {fullEntry.text}
                      </p>
                    )}
                    {photos.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6, marginTop: 16 }}>
                        {photos.map((p) => (
                          <div key={p.id} style={{ borderRadius: 6, overflow: "hidden", aspectRatio: "1", background: "rgba(0,0,0,0.3)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.dataUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12, opacity: 0.45 }}>
                      {fullEntry.media.filter(m => m.type === "audio").length > 0 && <span style={{ fontFamily: "Syne, sans-serif", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00c8f0" }}>{fullEntry.media.filter(m => m.type === "audio").length} audio</span>}
                      {fullEntry.media.filter(m => m.type === "video").length > 0 && <span style={{ fontFamily: "Syne, sans-serif", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C29F60" }}>{fullEntry.media.filter(m => m.type === "video").length} video</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Body (list mode) ── */}
      {viewMode === "list" && <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>

        {/* Entry list */}
        {(!isMobile || showList) && (
          <nav style={{
            width: isMobile ? "100%" : 240,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            overflowY: "auto",
            padding: "14px 10px",
            flexShrink: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(3,8,26,0.16) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, rgba(0,200,240,0.2), rgba(255,255,255,0.06), transparent)" }} />

            <WordOfDayCard sidebarMode />

            {list.length === 0 ? (
              <div style={{ padding: "32px 12px", textAlign: "center" }}>
                <NotebookPen size={28} color="rgba(0,200,240,0.2)" style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(222,211,200,0.35)", lineHeight: 1.6 }}>
                  Your journal is empty. Tap &ldquo;New Entry&rdquo; to begin.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {list.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openEntry(item.id)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "10px 12px", borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.18s cubic-bezier(0.23,1,0.32,1)",
                        ...(isActive ? {
                          background: "linear-gradient(135deg, rgba(0,200,240,0.12), rgba(0,80,180,0.07))",
                          borderTop: "1px solid rgba(0,200,240,0.3)",
                          borderLeft: "1px solid rgba(0,200,240,0.15)",
                          borderRight: "1px solid rgba(0,0,0,0.15)",
                          borderBottom: "1px solid rgba(0,0,0,0.3)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3), 0 0 16px rgba(0,180,220,0.08)",
                          transform: "translateX(2px)",
                        } : {
                          background: "transparent",
                          border: "1px solid transparent",
                        }),
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "rgba(255,255,255,0.03)";
                          el.style.borderColor = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "transparent";
                          el.style.borderColor = "transparent";
                        }
                      }}
                    >
                      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isActive ? "#00d8ff" : "rgba(0,200,240,0.55)", marginBottom: 3 }}>
                        {formatShortDate(item.date)}
                      </div>
                      <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#DED3C8" : "rgba(222,211,200,0.75)", lineHeight: 1.3, marginBottom: 2 }}>
                        {item.title || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Untitled</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        )}

        {/* Editor */}
        {(!isMobile || !showList) && (
          <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "36px 44px", maxWidth: isMobile ? "100%" : 860 }}>

            {/* Word of the Day — collapsible, starts closed */}
            <WordOfDayCard initialOpen={false} />

            {!entry ? (
              /* Empty state */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20 }}>
                <div style={{
                  ...glassCard,
                  borderRadius: 20,
                  padding: "48px 52px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: 400,
                }}>
                  <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), transparent)" }} />
                  <NotebookPen size={36} color="rgba(0,200,240,0.35)" style={{ marginBottom: 20 }} />
                  <h2 style={{ fontFamily: "Lora, Georgia, serif", fontSize: 22, fontWeight: 600, color: "#DED3C8", marginBottom: 10, lineHeight: 1.2 }}>
                    Your Journal
                  </h2>
                  <p style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 13, color: "rgba(222,211,200,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
                    Capture your thoughts, record your voice, document your journey — text, audio, and video in one place.
                  </p>
                  <button
                    onClick={createEntry}
                    style={{
                      ...raisedBtn,
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 24px", borderRadius: 8,
                      fontFamily: "Syne, system-ui, sans-serif",
                      fontSize: 12, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  >
                    <Plus size={14} /> Create First Entry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Entry header */}
                <div style={{
                  ...glassCard,
                  borderRadius: 14,
                  padding: "24px 28px",
                  marginBottom: 28,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(0,200,240,0.4), transparent)" }} />
                  <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,240,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

                  {/* Date */}
                  <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00c8f0", marginBottom: 10 }}>
                    {formatDate(entry.date)}
                  </div>

                  {/* Title */}
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Entry title…"
                    style={{
                      width: "100%", display: "block",
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: "Lora, Georgia, serif", fontWeight: 600,
                      fontSize: 26, color: "#DED3C8", lineHeight: 1.2,
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ height: 1, background: "linear-gradient(to right, rgba(0,200,240,0.2), rgba(194,159,96,0.1), transparent)", marginTop: 6 }} />

                  {/* Delete */}
                  <button
                    onClick={handleDeleteEntry}
                    style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", opacity: 0.35, transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.35"; }}
                  >
                    <Trash2 size={14} color="#ff6b6b" />
                  </button>
                </div>

                {/* ── Text body ── */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,200,240,0.6)" }}>
                      Notes
                    </div>
                    {/* Live dictation button */}
                    <button
                      onClick={dictation.toggle}
                      title={dictation.supported ? (dictation.listening ? "Stop dictating" : "Dictate into notes") : "Dictation requires Chrome or Edge"}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 5,
                        fontFamily: "Syne, system-ui, sans-serif", fontSize: 9, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        ...(dictation.listening ? {
                          background: "rgba(255,60,60,0.12)",
                          borderTop: "1px solid rgba(255,80,80,0.4)",
                          borderLeft: "1px solid rgba(255,60,60,0.2)",
                          borderRight: "1px solid rgba(0,0,0,0.15)",
                          borderBottom: "1px solid rgba(0,0,0,0.3)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.1), 0 0 12px rgba(255,60,60,0.15)",
                          color: "#ff6b6b",
                        } : {
                          background: "linear-gradient(180deg, rgba(0,200,240,0.12) 0%, rgba(0,100,180,0.06) 100%)",
                          borderTop: "1px solid rgba(0,200,240,0.3)",
                          borderLeft: "1px solid rgba(0,200,240,0.15)",
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                          borderBottom: "1px solid rgba(0,0,0,0.28)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)",
                          color: "#00c8f0",
                          opacity: dictation.supported ? 1 : 0.4,
                        }),
                      }}
                    >
                      {dictation.listening ? (
                        <>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 6px rgba(255,60,60,0.7)", animation: "pulse 1s ease-in-out infinite", flexShrink: 0 }} />
                          Stop Dictating
                        </>
                      ) : (
                        <><Mic size={10} /> Dictate</>
                      )}
                    </button>
                    {dictation.listening && (
                      <span style={{ fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontSize: 10, color: "#ff8888" }}>
                        Listening…
                      </span>
                    )}
                  </div>
                  <textarea
                    value={entry.text}
                    onChange={(e) => updateField("text", e.target.value)}
                    placeholder="Write your thoughts…"
                    rows={8}
                    style={{
                      width: "100%", display: "block",
                      background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(20,48,120,0.18) 100%)",
                      backdropFilter: "blur(18px) saturate(180%)",
                      WebkitBackdropFilter: "blur(18px) saturate(180%)",
                      border: "1.5px solid rgba(0,200,240,0.2)",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.2)",
                      borderRadius: 10,
                      padding: "20px 22px",
                      color: "#EDE5DC",
                      fontFamily: "Lora, Georgia, serif", fontWeight: 500,
                      fontSize: 15, lineHeight: 1.85,
                      resize: "vertical", outline: "none",
                      minHeight: 200,
                      WebkitFontSmoothing: "antialiased",
                      transition: "border-color 0.22s, box-shadow 0.22s",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,200,240,0.5)";
                      (e.target as HTMLTextAreaElement).style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.18), 0 0 0 3px rgba(0,200,240,0.1), 0 0 24px rgba(0,180,220,0.12)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = "rgba(0,200,240,0.2)";
                      (e.target as HTMLTextAreaElement).style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.2)";
                    }}
                  />
                </div>

                {/* ── Audio section ── */}
                <MediaSection title="Audio" icon={<Mic size={12} color="#00d8ff" />} accentColor="#00c8f0">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {/* Record button */}
                    <button
                      onClick={handleAudioRecord}
                      disabled={isRecordingVideo}
                      style={{
                        ...(isRecordingAudio ? {
                          background: "linear-gradient(180deg, rgba(255,80,80,0.22) 0%, rgba(200,30,30,0.12) 100%)",
                          borderTop: "1px solid rgba(255,100,100,0.5)",
                          borderLeft: "1px solid rgba(255,80,80,0.28)",
                          borderRight: "1px solid rgba(0,0,0,0.2)",
                          borderBottom: "1px solid rgba(0,0,0,0.4)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.15), 0 0 16px rgba(255,60,60,0.2)",
                        } : ghostBtn),
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: isRecordingAudio ? "#ff6b6b" : "#00d8ff",
                        cursor: isRecordingVideo ? "not-allowed" : "pointer",
                        opacity: isRecordingVideo ? 0.4 : 1,
                      }}
                    >
                      {isRecordingAudio ? (
                        <><MicOff size={12} /> Stop · {formatDur(audioRec.elapsed)}</>
                      ) : (
                        <><Mic size={12} /> Record</>
                      )}
                    </button>

                    {/* Upload button */}
                    <button
                      onClick={() => audioUploadRef.current?.click()}
                      disabled={isRecordingAudio}
                      style={{
                        ...ghostBtn,
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "rgba(222,211,200,0.7)",
                        opacity: isRecordingAudio ? 0.4 : 1,
                        cursor: isRecordingAudio ? "not-allowed" : "pointer",
                      }}
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input ref={audioUploadRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "audio")} />

                    {isRecordingAudio && (
                      <button
                        onClick={audioRec.cancel}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "Syne, system-ui, sans-serif", padding: "7px 8px" }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    )}
                  </div>

                  {/* Recording pulse */}
                  {isRecordingAudio && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px rgba(255,60,60,0.7)", animation: "pulse 1s ease-in-out infinite" }} />
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "#ff8888", letterSpacing: "0.1em" }}>RECORDING — {formatDur(audioRec.elapsed)}</span>
                    </div>
                  )}

                  {/* Audio clips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entry.media.filter((m) => m.type === "audio").map((item) => (
                      <MediaPlayer key={item.id} item={item} onDelete={() => removeMedia(item.id)} onTranscribe={() => handleTranscribeClip(item)} />
                    ))}
                  </div>
                </MediaSection>

                {/* ── Photos section ── */}
                <MediaSection title="Photos" icon={<Image size={12} color="#a78bfa" />} accentColor="#a78bfa">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => photoUploadRef.current?.click()}
                      style={{
                        ...ghostBtn,
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "#a78bfa",
                        cursor: "pointer",
                      }}
                    >
                      <Upload size={12} /> Add Photos
                    </button>
                    <input
                      ref={photoUploadRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  {/* Photo grid */}
                  {entry.media.filter((m) => m.type === "image").length > 0 && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                      gap: 8,
                    }}>
                      {entry.media.filter((m) => m.type === "image").map((item) => (
                        <div key={item.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", background: "rgba(0,0,0,0.3)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.dataUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <button
                            onClick={() => removeMedia(item.id)}
                            style={{
                              position: "absolute", top: 4, right: 4,
                              width: 20, height: 20, borderRadius: "50%",
                              background: "rgba(0,0,0,0.65)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", padding: 0,
                            }}
                          >
                            <X size={10} color="#ff6b6b" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </MediaSection>

                {/* ── Video section ── */}
                <MediaSection title="Video" icon={<Video size={12} color="#C29F60" />} accentColor="#C29F60">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {/* Record button */}
                    <button
                      onClick={handleVideoRecord}
                      disabled={isRecordingAudio}
                      style={{
                        ...(isRecordingVideo ? {
                          background: "linear-gradient(180deg, rgba(255,80,80,0.22) 0%, rgba(200,30,30,0.12) 100%)",
                          borderTop: "1px solid rgba(255,100,100,0.5)",
                          borderLeft: "1px solid rgba(255,80,80,0.28)",
                          borderRight: "1px solid rgba(0,0,0,0.2)",
                          borderBottom: "1px solid rgba(0,0,0,0.4)",
                          boxShadow: "inset 0 1px 0 rgba(255,150,150,0.15), 0 0 16px rgba(255,60,60,0.2)",
                        } : ghostBtn),
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: isRecordingVideo ? "#ff6b6b" : "#C29F60",
                        cursor: isRecordingAudio ? "not-allowed" : "pointer",
                        opacity: isRecordingAudio ? 0.4 : 1,
                      }}
                    >
                      {isRecordingVideo ? (
                        <><VideoOff size={12} /> Stop · {formatDur(videoRec.elapsed)}</>
                      ) : (
                        <><Video size={12} /> Record</>
                      )}
                    </button>

                    {/* Upload button */}
                    <button
                      onClick={() => videoUploadRef.current?.click()}
                      disabled={isRecordingVideo}
                      style={{
                        ...ghostBtn,
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 7,
                        fontFamily: "Syne, system-ui, sans-serif",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "rgba(222,211,200,0.7)",
                        opacity: isRecordingVideo ? 0.4 : 1,
                        cursor: isRecordingVideo ? "not-allowed" : "pointer",
                      }}
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input ref={videoUploadRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleUpload(e, "video")} />

                    {isRecordingVideo && (
                      <button
                        onClick={videoRec.cancel}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(222,211,200,0.45)", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "Syne, system-ui, sans-serif", padding: "7px 8px" }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    )}
                  </div>

                  {/* Recording pulse */}
                  {isRecordingVideo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px rgba(255,60,60,0.7)" }} />
                      <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontSize: 10, color: "#ff8888", letterSpacing: "0.1em" }}>RECORDING — {formatDur(videoRec.elapsed)}</span>
                    </div>
                  )}

                  {/* Video clips */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {entry.media.filter((m) => m.type === "video").map((item) => (
                      <MediaPlayer key={item.id} item={item} onDelete={() => removeMedia(item.id)} />
                    ))}
                  </div>
                </MediaSection>
              </>
            )}
          </main>
        )}
      </div>}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        textarea::placeholder { color: rgba(222,211,200,0.3); font-style: italic; }
        input::placeholder { color: rgba(222,211,200,0.25); }
      `}</style>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function MediaSection({ title, icon, accentColor, children }: { title: string; icon: React.ReactNode; accentColor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        paddingBottom: 10,
        borderBottom: `1px solid ${accentColor}22`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `radial-gradient(circle, ${accentColor}22, transparent 70%)`,
          border: `1px solid ${accentColor}33`,
          boxShadow: `0 0 10px ${accentColor}18`,
        }}>
          {icon}
        </div>
        <span style={{
          fontFamily: "Syne, system-ui, sans-serif", fontSize: 8, fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: `${accentColor}`,
          opacity: 0.8,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
