// ─── Medicine animals ─────────────────────────────────────────────────────────
// Original symbolic reflections written for the Collective in the Operation
// Kuthumi voice. Drawn from the wide human conversation with animals across many
// cultures; they make no claim to any specific Indigenous ceremonial teaching.

export type TotemKind = "bird" | "mammal" | "insect" | "water" | "reptile";
export type TotemElement = "fire" | "water" | "air" | "earth";
export type TotemDirection = "east" | "south" | "west" | "north" | "above" | "below" | "within";

export interface Totem {
  slug: string;
  name: string;
  kind: TotemKind;
  element: TotemElement;
  direction: TotemDirection;
  /** One line shown on cards */
  essence: string;
  keywords: string[];
  medicine: string;
  shadow: string;
  appears: string;
  prompt: string;
  /** Irregular plural; regular ones (owls, foxes, wolves, butterflies) are derived */
  plural?: string;
  /** Other names that should link to this animal in the journal */
  aliases?: string[];
  /** The word is also an everyday verb or noun ("bear with me", "dove into"), so
   *  the journal only links it after a determiner or before "medicine" etc. */
  ambiguous?: boolean;
}

export const KIND_LABELS: Record<TotemKind, string> = {
  bird: "Birds", mammal: "Mammals", insect: "Insects", water: "Water", reptile: "Reptiles",
};
export const ELEMENT_LABELS: Record<TotemElement, string> = {
  fire: "Fire", water: "Water", air: "Air", earth: "Earth",
};
export const DIRECTION_LABELS: Record<TotemDirection, string> = {
  east: "East", south: "South", west: "West", north: "North", above: "Above", below: "Below", within: "Within",
};

export const TOTEMS: Totem[] = [
  // ─── Birds ──────────────────────────────────────────────────────────────────
  {
    slug: "owl", name: "Owl", kind: "bird", element: "air", direction: "north",
    essence: "Sight that travels through the dark",
    keywords: ["Night vision", "Truth", "Silent knowing"],
    medicine: "We meet Owl in the hours when the house is quiet and the mind finally stops arranging the day, and in that stillness Owl offers the gift of seeing what daylight hides. This is the medicine of perception that moves through shadow on soft wings, catching the small truth beneath the polite story and the feeling beneath the words. Owl teaches us to trust the knowing that arrives in silence, the kind that asks for no proof because it simply recognizes what is real.",
    shadow: "The same keen sight can turn inward and become a sleepless vigilance, where we watch every gesture for hidden meaning and lose our capacity to rest. Owl in shadow may also keep its wisdom perched far above the world, observing life from a cool distance that protects the heart from being touched. When we catch ourselves analyzing a moment that is asking to be felt, Owl invites us down from the branch to land in our own warm body.",
    appears: "When Owl crosses our path, in a dream, a field at dusk, or a feather on the trail, it often signals that something previously hidden is ready to come into view. A situation may hold more than it first appeared, and Owl asks us to listen for the quiet signal before we act. Many people also feel Owl near during endings and thresholds, as a companion who sits with us while one chapter closes and a wiser one gathers itself in the dark.",
    prompt: "What truth have I been sensing in the quiet that I am now ready to see clearly?",
  },
  {
    slug: "hawk", name: "Hawk", kind: "bird", element: "air", direction: "east",
    essence: "The messenger who sees the whole field",
    keywords: ["Clear focus", "Messages", "Perspective"],
    medicine: "Hawk circles high on the warm currents of morning, and from that height the scattered details of the land below arrange themselves into a single readable pattern. This is the medicine of perspective, the ability to rise above the noise of the moment and notice where the path actually leads. Hawk also carries the gift of the messenger, sharpening our attention so that the sign, the phrase, or the chance meeting we might have overlooked suddenly glows with meaning.",
    shadow: "Hawk in shadow can become a restless scanning, where we are always looking for the next sign and rarely settle long enough to receive the one already given. The sharp eye may also turn critical, spotting every flaw in others from a lofty perch while our own landing stays uncertain. Hawk asks us to remember that height is for seeing, and that every flight eventually returns to the branch where we live.",
    appears: "When Hawk appears, many of us feel a quickening, as though life has turned up the volume on its signals. It may be time to pay close attention to recurring themes, to the words of people who arrive unexpectedly, and to the intuitive flash that comes before thought. Hawk often visits when a decision is near, offering the wider view so that we can choose from clarity.",
    prompt: "If I rose above this situation and looked down on it from the sky, what pattern would I finally see?",
  },
  {
    slug: "eagle", name: "Eagle", kind: "bird", element: "air", direction: "above",
    essence: "Courage that lives close to the sun",
    keywords: ["Vision", "Sovereignty", "Sacred connection"],
    medicine: "Eagle flies higher than almost any creature we can see, and across countless cultures it has been honored as a bridge between the earth and the great sky. Its medicine is expansive vision paired with the courage to live by it, the kind of seeing that holds the whole horizon while still catching the single glint of movement on the ground. When we work with Eagle we are reminded that our lives are part of something vast and sacred, and that we are allowed to rise into that vastness with dignity.",
    shadow: "The shadow of Eagle appears when altitude becomes isolation, when we soar so far into ideals and big visions that the ordinary tenderness of daily life feels beneath us. Eagle in shadow can also carry a heavy pride, a sense that we must always be the strongest one in the sky. The invitation is to let our vision descend into embodiment, so that what we see from on high becomes something we can actually build and share.",
    appears: "Eagle tends to arrive when we are being asked to expand, to take a larger view of our purpose and to step into a role that requires both courage and grace. Its appearance can feel like a blessing on a new direction, or a call to remember a spiritual commitment we made long ago. Eagle also visits when we need to rise above a small conflict and see it from the height of our deeper values.",
    prompt: "What larger vision for my life is asking me to rise to meet it?",
  },
  {
    slug: "raven", name: "Raven", kind: "bird", element: "air", direction: "west",
    essence: "Keeper of mystery and the magic of change",
    keywords: ["Mystery", "Transformation", "Clever wisdom"],
    medicine: "Raven moves between worlds with a gleam in its eye, a creature of intelligence and play that seems to know the secret behind the curtain. Across many traditions Raven has been seen as a keeper of mystery, a shapeshifter whose medicine is the magic of transformation itself. Raven teaches us that the unknown can be approached with curiosity, that the void before creation is full of possibility, and that a sense of humor is one of the most powerful forms of wisdom.",
    shadow: "In shadow, Raven can become the trickster who uses cleverness to dodge accountability, talking around the truth while the truth waits patiently to be stood in. We may also find ourselves collecting shiny distractions, gathering ideas and experiences while avoiding the deeper change they point toward. Raven asks us to let our intelligence serve our integrity, so that the magic we make leaves the world more whole.",
    appears: "When Raven appears, change is often already stirring beneath the surface, and the familiar shape of our lives may be preparing to shift. Raven invites us to welcome the mystery of this time and to watch for the synchronicities that seem almost playful in their timing. It can also signal that a hidden part of us is ready to be reclaimed, brought out of the dark and set gleaming in the light.",
    prompt: "What mystery in my life am I being invited to approach with curiosity and play?",
  },
  {
    slug: "crow", name: "Crow", kind: "bird", element: "air", direction: "west",
    essence: "The voice of sacred law and community",
    keywords: ["Integrity", "Community", "Adaptability"],
    medicine: "Crow lives among us with a bright and watchful presence, gathering in families, remembering faces, and calling out across the rooftops with a voice that refuses to be ignored. Its medicine is a deep relationship with natural law and with community, the understanding that what we do ripples outward through every life connected to ours. Crow teaches us to speak our truth plainly, to adapt with intelligence to whatever environment we find ourselves in, and to live in alignment with what we know to be right.",
    shadow: "Crow in shadow can grow loud and judgmental, cawing about the faults of others while quietly bending its own rules. It may also show up as a restless opportunism, where we take what is convenient and lose touch with the deeper law that holds a community together. Crow asks us to bring our words and our actions into one clear line, so that our voice carries the weight of lived integrity.",
    appears: "When Crow gathers around us, we may be called to look honestly at whether our daily choices match our spoken values. It can be a sign that our community, our family, or our circle of friends holds an important message, or that our own voice is needed in a conversation. Crow also visits during seasons of adaptation, reminding us that we have the intelligence to thrive in a changing landscape.",
    prompt: "Where in my life am I being asked to bring my actions into alignment with what I already know is true?",
  },
  {
    slug: "hummingbird", name: "Hummingbird", kind: "bird", element: "air", direction: "south",
    essence: "Joy that drinks from every flower",
    keywords: ["Joy", "Lightness", "Presence"],
    medicine: "Hummingbird hovers in the air on wings that beat faster than the eye can follow, suspended in a perfect present moment while it drinks the sweetness of the flower. This tiny being carries an enormous medicine of joy, the reminder that delight is a form of nourishment and that the sweetness of life is meant to be tasted. Hummingbird teaches us to move lightly, to find the nectar in each experience, and to trust that even the smallest heart can travel great distances.",
    shadow: "The shadow of Hummingbird is a frantic busyness, a darting from task to task and pleasure to pleasure while the body runs on empty. We may also seek sweetness outside ourselves so constantly that we forget how to rest and replenish within. Hummingbird asks us to notice when our speed has become a way of avoiding stillness, and to let our joy include the quiet pause between flowers.",
    appears: "Hummingbird often arrives when life has grown heavy, as a bright invitation to remember what makes the heart sing. It may be asking us to celebrate a small victory, to savor beauty, or to bring more playfulness into a situation that has become too serious. Hummingbird can also signal that a long migration of the soul is underway, and that our resilience is greater than we know.",
    prompt: "Where is the sweetness in my life right now, and how can I drink from it more fully?",
  },
  {
    slug: "heron", name: "Heron", kind: "bird", element: "water", direction: "west",
    essence: "Patience that stands at the edge of the water",
    keywords: ["Patience", "Self reliance", "Standing between worlds"],
    medicine: "Heron stands motionless at the edge of the water for long, luminous minutes, balanced on one leg between the land and the shallows, and in that stillness it embodies a rare kind of patience. Its medicine is the wisdom of waiting with full attention, trusting that the right moment will arrive and that we will know it when it comes. Heron also teaches self reliance, the grace of standing alone in our own rhythm while remaining deeply connected to the living world around us.",
    shadow: "Heron in shadow can turn its solitude into a wall, standing so far apart from others that connection begins to feel impossible. The long patience may also become hesitation, where we wait and wait for certainty and let the moment glide past us. Heron invites us to honor our independent nature while remembering that even the most solitary bird returns to the colony to nest.",
    appears: "When Heron appears, we may be standing at a threshold, living between two phases of life and learning to be comfortable in that liminal place. It can be a call to slow down and observe before acting, to let the waters settle until we can see clearly to the bottom. Heron also blesses those who walk an unusual path, affirming that our own timing is wise.",
    prompt: "What am I waiting for, and how can I wait with more presence and less worry?",
  },
  {
    slug: "swan", name: "Swan", kind: "bird", element: "water", direction: "west",
    essence: "Grace that unfolds through surrender",
    keywords: ["Grace", "Inner beauty", "Devotion"],
    medicine: "Swan glides across the still water with such effortless grace that it seems to belong to a dream, and many traditions have seen in it a symbol of the soul gliding through the waters of life. Its medicine is the grace that comes from surrender, the willingness to move with the currents of our becoming and allow our true beauty to unfold in its own season. Swan also carries the energy of devoted love and partnership, teaching us that tenderness and strength can live together in one graceful form.",
    shadow: "Swan in shadow can become a preoccupation with appearances, gliding serenely on the surface while working frantically underneath to maintain an image. We may also struggle to recognize our own beauty, still seeing ourselves as the awkward young bird long after our transformation has taken place. Swan invites us to release the effort of looking graceful and to trust the grace that is already ours.",
    appears: "When Swan appears, a quiet transformation may be completing itself within us, and we are being asked to recognize who we have become. It can signal a time to soften, to let go of control, and to allow life to carry us toward something beautiful. Swan also visits relationships, blessing partnerships with loyalty and inviting us to love with both devotion and freedom.",
    prompt: "What beauty in myself have I been slow to recognize?",
  },
  {
    slug: "dove", name: "Dove", kind: "bird", element: "air", direction: "east", ambiguous: true,
    essence: "Peace that coos softly at dawn",
    keywords: ["Peace", "Gentleness", "Renewal"],
    medicine: "The soft call of Dove drifting through the early morning has a way of settling the nervous system, as though the world itself were exhaling. Dove carries a medicine of peace that is gentle and abiding, a reminder that calm is a strength and that softness can hold a great deal of power. Across many cultures Dove has also been a messenger of renewal and hope, the bird that returns carrying a green branch to say that new land is near.",
    shadow: "The shadow of Dove can be a peace that is kept at any cost, where we swallow our needs and avoid every conflict in order to keep the surface calm. We may also become so gentle with others that we forget to offer that same gentleness to ourselves. Dove asks us to remember that true peace includes our own voice, and that honest words spoken kindly are an offering of love.",
    appears: "When Dove appears, it often brings comfort after a difficult season, a sign that a time of renewal is beginning. We may be invited to soften our approach to a situation, to seek reconciliation, or to rest in the simple goodness of the present moment. Dove can also arrive as a reminder to tend our own inner peace first, so that it may ripple outward to everyone we love.",
    prompt: "What would it look like to bring a deeper peace into the situation that weighs on me most?",
  },
  {
    slug: "falcon", name: "Falcon", kind: "bird", element: "fire", direction: "south",
    essence: "Precision, speed, and perfect timing",
    keywords: ["Precision", "Timing", "Swift action"],
    medicine: "Falcon is the fastest creature in the sky, folding its wings and plunging toward its mark with a speed that seems impossible, and yet every part of that dive is guided by perfect precision. Its medicine is the union of patience and action, the wisdom to circle and watch until the moment is right and then commit with complete focus. Falcon teaches us that power is most beautiful when it is aimed, and that our energy becomes extraordinary when we gather it toward a single purpose.",
    shadow: "Falcon in shadow can become impatience, a habit of diving before we have truly seen our target and then wondering why we keep missing. It may also appear as a sharpness in our words, a quickness that cuts others when we intended only to be clear. Falcon invites us to honor the long circling flight that precedes the dive, letting our speed grow from deep attention.",
    appears: "When Falcon appears, an opportunity may be approaching that will ask for decisive and focused action. It can be a call to sharpen our goals, to let go of distractions, and to trust our timing. Falcon also visits when we have been circling something for a long time, signaling that the moment to commit has arrived.",
    prompt: "What is the one aim that deserves the full focus of my energy right now?",
  },
  {
    slug: "vulture", name: "Vulture", kind: "bird", element: "air", direction: "below",
    essence: "Sacred purification and the patience of renewal",
    keywords: ["Purification", "Renewal", "Patience"],
    medicine: "Vulture rides the thermals in slow and graceful circles, rarely flapping its great wings, conserving its energy as it waits for the earth to call it down. Its medicine is the sacred work of purification, transforming what has ended into nourishment so that the cycle of life can continue clean and whole. Vulture teaches us that every ending carries the seeds of renewal, and that there is deep wisdom in the willingness to work with what others turn away from.",
    shadow: "Vulture in shadow can be a lingering over what is already finished, circling old wounds and past losses long after they have given their nourishment. We may also feel unseen or unappreciated for the essential, humble work we do, and begin to carry that weight as resentment. Vulture asks us to honor our role in the cycle and to let what has ended return fully to the earth.",
    appears: "When Vulture appears, something in our lives may have reached its natural completion and is ready to be transformed. It can be an invitation to clear away the remains of an old pattern, relationship, or belief so that new life can grow. Vulture also teaches patience, reminding us to ride the currents and conserve our energy until the right moment to act.",
    prompt: "What has already ended in my life that I am ready to let return to the earth?",
  },
  {
    slug: "peacock", name: "Peacock", kind: "bird", element: "fire", direction: "south",
    essence: "Radiant beauty and a thousand watching eyes",
    keywords: ["Radiance", "Self expression", "Awakened vision"],
    medicine: "When Peacock opens its tail, a shimmering fan of jeweled eyes unfolds in every direction, and in that moment we witness one of the most extravagant displays of beauty in the natural world. Its medicine is radiant self expression, the courage to let our true colors be seen and to take up our full space with joy. Many traditions have also connected the eyes on its feathers with awakened vision and watchful protection, a reminder that beauty and wisdom can walk together.",
    shadow: "The shadow of Peacock is a display that seeks approval, a beauty that only feels real when someone else is watching and applauding. We may also hide our colors entirely, fearing that being seen will invite judgment or envy. Peacock invites us to express our radiance as an offering, letting it flow from a place of inner wholeness.",
    appears: "When Peacock appears, we may be ready to step into greater visibility, to share our gifts and let our authentic beauty shine. It can signal a season of confidence and celebration, a time to honor how far we have come. Peacock also asks us to look around with its many eyes, noticing the beauty and the meaning hidden in ordinary days.",
    prompt: "Which of my true colors am I ready to show the world?",
  },
  {
    slug: "woodpecker", name: "Woodpecker", kind: "bird", element: "earth", direction: "east",
    essence: "The steady drumbeat of persistence",
    keywords: ["Rhythm", "Persistence", "Opportunity"],
    medicine: "The steady drumming of Woodpecker echoes through the forest like a heartbeat, a patient rhythm that slowly opens the hard wood to reveal what waits inside. Its medicine is persistence guided by rhythm, the understanding that great things are often accomplished through small repeated efforts offered with devotion. Woodpecker also teaches us to listen for opportunity, tapping gently on the surface of our lives until we hear the hollow sound that tells us where to dig.",
    shadow: "Woodpecker in shadow can become a repetitive habit that has lost its purpose, a hammering at the same spot long after it has stopped yielding anything new. We may also push so hard toward a goal that we wear ourselves down, forgetting that rhythm includes rest between the beats. Woodpecker asks us to drum with wisdom, choosing where we invest our effort and honoring the pauses.",
    appears: "When Woodpecker appears, we may be close to a breakthrough that will reward our persistence, and it encourages us to keep going with steady devotion. It can also be a call to tune into the natural rhythms of our bodies and our days. Woodpecker often visits when an opportunity is knocking, asking us to listen and answer.",
    prompt: "What steady practice, offered with devotion, could open the door I have been knocking on?",
  },
  {
    slug: "pelican", name: "Pelican", kind: "bird", element: "water", direction: "west",
    essence: "Generosity that rises buoyant from the sea",
    keywords: ["Generosity", "Buoyancy", "Renewal"],
    medicine: "Pelican skims low over the waves in graceful lines and then plunges into the sea, rising again with an ease that seems to defy the weight of the water. Its medicine is buoyancy, the ability to rise above difficulty with lightness and to return to the surface of our lives renewed. Pelican has also been honored in many traditions as a symbol of generous, self giving love, a reminder that the abundance we gather can be shared with those we care for.",
    shadow: "Pelican in shadow can give so much that its own reserves run dry, pouring itself out for others until there is nothing left for its own heart. We may also struggle to receive, feeling more comfortable in the role of the provider. Pelican asks us to fill our own pouch first, trusting that generosity flows most freely from a full and nourished spirit.",
    appears: "When Pelican appears, we may be emerging from a challenging time, and it reminds us that we have the resilience to rise. It can be an invitation to let go of heavy burdens and to approach life with greater lightness. Pelican also asks us to reflect on the balance between giving and receiving in our relationships.",
    prompt: "How can I receive as generously as I give?",
  },
  {
    slug: "condor", name: "Condor", kind: "bird", element: "air", direction: "above",
    essence: "Ancient vision riding the high winds",
    keywords: ["Ancient wisdom", "Higher vision", "Renewal"],
    medicine: "Condor rides the high mountain winds on wings so vast that it can glide for hours without a single beat, carried by currents that lesser birds cannot reach. In the lands where it soars, Condor has long been regarded as a sacred bird of great age and dignity, and we honor that reverence by meeting it with humility. Its medicine, as we receive it, is elder wisdom and expansive vision, the patience to let the great winds of life carry us toward our purpose.",
    shadow: "Condor in shadow can become a weariness, a sense that we have seen so much that nothing new can surprise or move us. We may also hold ourselves so far above the world that our wisdom stays out of reach of those who could receive it. Condor invites us to share what we have learned, letting our long view become a gift for those who are just beginning.",
    appears: "When Condor appears, we may be stepping into a season of maturity, called to carry wisdom with grace and to see our lives in their full sweep. It can also signal a renewal of vision after a long period of struggle. Condor reminds us to trust the currents that are already carrying us.",
    prompt: "What wisdom have my years given me that I am ready to share?",
  },
  {
    slug: "blue-jay", name: "Blue Jay", kind: "bird", element: "air", direction: "east",
    essence: "Bold voice and bright intelligence",
    keywords: ["Boldness", "Intelligence", "Clear voice"],
    aliases: ["bluejay", "blue jays", "bluejays"],
    medicine: "Blue Jay flashes through the trees in brilliant color, announcing itself with a bold voice that carries across the whole forest. Its medicine is fearless self expression and quick intelligence, the confidence to speak up, to claim our place, and to use our cleverness in service of what matters. Blue Jay teaches us that our voice is a gift and that the clarity of our words can protect what we love.",
    shadow: "Blue Jay in shadow can become loud for the sake of being heard, dominating conversations and scattering our energy across too many interests. We may also use our cleverness to stir up drama when a quieter wisdom would serve better. Blue Jay asks us to speak with purpose, letting our bold voice be anchored in a grounded heart.",
    appears: "When Blue Jay appears, we may be called to speak our truth with confidence, especially in a situation where we have been holding back. It can also be a reminder to use our resourcefulness and to trust our quick perception. Blue Jay often visits when we need to stand up for ourselves or for someone we love.",
    prompt: "What truth is ready to be spoken in my own bold and clear voice?",
  },
  // ─── Mammals ────────────────────────────────────────────────────────────────
  {
    slug: "wolf", name: "Wolf", kind: "mammal", element: "earth", direction: "north",
    essence: "The teacher who runs with the pack and walks alone",
    keywords: ["Instinct", "Loyalty", "Teaching"],
    medicine: "Wolf moves through the deep forest guided by an instinct so refined that it can follow a single thread of scent across miles of snow. Its medicine is the trust of our own inner knowing, paired with a profound loyalty to the pack, the family and community we choose to run beside. Many people experience Wolf as a teacher and a pathfinder, a presence that returns from long solitary journeys carrying wisdom to share with those who follow.",
    shadow: "Wolf in shadow can swing between two edges, either losing itself entirely in the needs of the pack or withdrawing into a lonely wildness that trusts no one. We may also carry an old wariness, keeping our instincts sharp for danger long after the danger has passed. Wolf invites us to balance freedom and belonging, honoring both the call of the open land and the warmth of the den.",
    appears: "When Wolf appears, our intuition is often being sharpened, and we are asked to trust the subtle signals that guide us toward what is right. It can mark a time to strengthen our bonds with the people who truly feel like family, or to step into a teaching role. Wolf also visits when we are being called to walk our own path, even if for a season we walk it alone.",
    prompt: "What is my instinct telling me that my mind keeps trying to talk me out of?",
  },
  {
    slug: "bear", name: "Bear", kind: "mammal", element: "earth", direction: "west",
    essence: "Strength that knows when to go within",
    keywords: ["Introspection", "Strength", "Healing"],
    ambiguous: true,
    medicine: "Bear wanders the mountains and riverbanks through the long bright months and then, as the cold arrives, retreats into the dark of the cave to dream through the winter. Its medicine lives in that rhythm, a great physical strength held in balance with the wisdom to turn inward, rest, and listen. Bear teaches us that introspection is a source of power, and that the answers we seek often wait for us in the quiet cave of our own heart.",
    shadow: "Bear in shadow can retreat into the cave and refuse to come out, mistaking isolation for rest and letting the long winter stretch into seasons. It may also show its strength as defensiveness, rising up to protect itself when gentleness would serve. Bear asks us to honor our need for solitude while trusting that spring will call us back into the world.",
    appears: "When Bear appears, we may be entering a season of hibernation, a time to rest, reflect, and gather our strength before the next great movement of our lives. It can also be a call to stand firmly in our power and protect what we love with courage. Bear often visits during times of healing, reminding us that the body carries its own deep wisdom.",
    prompt: "What answer is waiting for me in the quiet cave of my own heart?",
  },
  {
    slug: "deer", name: "Deer", kind: "mammal", element: "earth", direction: "east",
    essence: "Gentleness that disarms and heals",
    keywords: ["Gentleness", "Compassion", "Sensitivity"],
    aliases: ["doe", "fawn", "fawns", "stag", "stags"],
    medicine: "Deer steps softly into the clearing at the edge of dawn, alert to every sound, moving with a grace that seems to ask the whole forest for permission. Its medicine is gentleness as a living strength, the power of compassion to soften hardened hearts and to open doors that force would only hold shut. Deer teaches us to meet ourselves and others with tenderness, trusting that kindness can transform even the most guarded situation.",
    shadow: "Deer in shadow can become hypersensitive, so attuned to every possible threat that it startles at shadows and flees before understanding what it sees. We may also offer gentleness to everyone else while being harsh with ourselves. Deer asks us to turn our compassion inward, letting our sensitivity become a source of wisdom.",
    appears: "When Deer appears, we may be called to soften our approach, to lead with kindness and patience in a situation that has felt tense. It can also be a reminder to protect our sensitive nature and to rest in places where we feel safe. Deer often visits when a gentle heart is exactly what the moment needs.",
    prompt: "Where in my life is gentleness ready to accomplish what effort alone has been reaching for?",
  },
  {
    slug: "fox", name: "Fox", kind: "mammal", element: "fire", direction: "south",
    essence: "Clever grace at the edges of the day",
    keywords: ["Cleverness", "Adaptability", "Discretion"],
    plural: "foxes",
    medicine: "Fox slips through the tall grass at twilight, a flash of copper that appears and vanishes before we can be sure we saw it at all. Its medicine is graceful intelligence, the ability to read a situation quickly, adapt with ease, and move through complexity without drawing unnecessary attention. Fox teaches us the art of discretion, knowing when to be seen and when to blend into the landscape while we quietly observe.",
    shadow: "Fox in shadow can turn its cleverness toward cunning, slipping out of commitments and avoiding the vulnerability of being fully known. We may also become so skilled at blending in that we lose touch with our own true colors. Fox invites us to use our intelligence with integrity and to let ourselves be seen by those who are safe.",
    appears: "When Fox appears, we may need to approach a situation with quick wit and careful observation before revealing our intentions. It can be a sign to trust our ability to adapt to new circumstances with grace. Fox also visits when we are being asked to notice what is happening at the edges of our awareness.",
    prompt: "What is happening at the edges of my awareness that deserves a closer look?",
  },
  {
    slug: "horse", name: "Horse", kind: "mammal", element: "fire", direction: "south",
    essence: "Freedom, power, and the journey forward",
    keywords: ["Freedom", "Personal power", "Movement"],
    aliases: ["mare", "mares", "stallion", "stallions", "pony", "ponies"],
    medicine: "Horse runs across the open plain with its mane flowing in the wind, and in that wild movement we feel the pulse of freedom itself. Its medicine is personal power expressed through movement, the strength to carry ourselves and others forward on the long journey of life. Horse has partnered with humanity for thousands of years, and it teaches us that true power is shared, respected, and offered freely.",
    shadow: "Horse in shadow can feel trapped, pacing behind a fence and longing for a freedom it has forgotten how to claim. We may also allow others to ride us too hard, carrying burdens that belong to someone else. Horse invites us to reclaim our power, honoring both our desire to roam and our capacity for true partnership.",
    appears: "When Horse appears, we may be ready to move forward with new energy, to take a journey or begin a new chapter. It can be a call to reclaim our freedom in a situation where we have felt restricted. Horse also visits when we are learning to balance our strength with gentleness.",
    prompt: "Where in my life am I longing to run freely, and what would it take to open the gate?",
  },
  {
    slug: "buffalo", name: "Buffalo", kind: "mammal", element: "earth", direction: "north",
    essence: "Abundance born of gratitude",
    keywords: ["Abundance", "Gratitude", "Endurance"],
    plural: "buffaloes",
    aliases: ["bison", "buffalos"],
    medicine: "Buffalo walks the grasslands in great herds, its massive body steady against the wind, facing into the storm and walking steadily through it. Its medicine is abundance rooted in gratitude, the deep understanding that life provides what we need when we honor what we have been given. Buffalo teaches us endurance and steadiness, the strength to walk through challenge with patience and reverence for all that sustains us.",
    shadow: "Buffalo in shadow can carry a heavy burden of scarcity, forgetting the abundance already present and grasping for more. We may also become stubborn, standing so firmly in place that we resist necessary change. Buffalo invites us to return to gratitude and to walk forward with steady trust.",
    appears: "When Buffalo appears, it often signals a time of provision and blessing, and it asks us to receive with gratitude. It can also be a call to face a difficult situation directly with patience and courage. Buffalo reminds us that our endurance is greater than we know.",
    prompt: "What abundance is already present in my life, waiting for me to pause and honor it?",
  },
  {
    slug: "coyote", name: "Coyote", kind: "mammal", element: "fire", direction: "south",
    essence: "The sacred trickster who teaches through laughter",
    keywords: ["Humor", "Paradox", "Humility"],
    medicine: "Coyote trots along the edge of the canyon at dusk, singing its wild song to the rising moon, a creature of tremendous adaptability and mischievous intelligence. Its medicine is the wisdom of the trickster, the teaching that arrives through laughter, paradox, and the humbling moments when our carefully laid plans unravel. Coyote reminds us to hold life lightly, to laugh at ourselves, and to find the sacred hidden in absurdity.",
    shadow: "Coyote in shadow can become the fool who keeps repeating the same mistake, too clever to see the lesson right in front of it. We may also use humor to deflect from what we really feel. Coyote asks us to let the trick teach us, so that each stumble becomes an opening into deeper wisdom.",
    appears: "When Coyote appears, life may be about to surprise us, and we are invited to meet the unexpected with humor and flexibility. It can be a sign that we are taking ourselves too seriously, or that a lesson keeps returning because it is still waiting to be received. Coyote reminds us that our cleverness is a gift when it is paired with humility.",
    prompt: "What lesson keeps returning to me, and what might it be trying to teach me with a smile?",
  },
  {
    slug: "elk", name: "Elk", kind: "mammal", element: "earth", direction: "north",
    essence: "Stamina and the strength of companionship",
    keywords: ["Stamina", "Pride", "Companionship"],
    aliases: ["wapiti"],
    medicine: "Elk moves through the high meadows with a quiet majesty, its great antlers lifted toward the sky, and in autumn its bugling call rings across the valleys like a horn. Its medicine is stamina and steady pacing, the ability to travel great distances by moving at a sustainable rhythm. Elk also teaches us the strength found in companionship, the support of those who share our path and our nature.",
    shadow: "Elk in shadow can push too hard and too fast, burning through its reserves before the long journey is complete. We may also carry a pride that keeps us from asking for help. Elk invites us to pace ourselves wisely and to lean on the companions who walk beside us.",
    appears: "When Elk appears, we may be beginning a long endeavor that will require patience and endurance. It can be a call to seek out the company of kindred spirits who understand our journey. Elk reminds us that we will reach our destination when we move with a sustainable rhythm.",
    prompt: "How can I pace myself so that my energy lasts for the full length of this journey?",
  },
  {
    slug: "moose", name: "Moose", kind: "mammal", element: "water", direction: "north",
    essence: "Quiet confidence and deep self esteem",
    keywords: ["Self esteem", "Dignity", "Depth"],
    medicine: "Moose wades into the cold northern lakes and lowers its great head beneath the surface to feed, emerging with water streaming from its broad antlers. Its medicine is a quiet and grounded self esteem, the confidence of one who knows its own worth and has nothing to prove. Moose teaches us to trust our depth, to dive into the waters of our inner life, and to carry our gifts with simple dignity.",
    shadow: "Moose in shadow can become overconfident, charging forward with a stubbornness that ignores the wisdom of others. We may also hide our accomplishments, uncomfortable with the recognition they bring. Moose asks us to celebrate our achievements with gratitude and to honor the gifts that others carry too.",
    appears: "When Moose appears, it may be time to recognize how far we have come and to feel genuine joy for our accomplishments. It can also invite us to explore the deeper waters of our feelings and intuition. Moose reminds us that true confidence is quiet and steady.",
    prompt: "What accomplishment am I ready to honor with quiet pride?",
  },
  {
    slug: "mountain-lion", name: "Mountain Lion", kind: "mammal", element: "fire", direction: "south",
    essence: "Leadership carried with grace",
    keywords: ["Leadership", "Courage", "Grace"],
    aliases: ["mountain lions", "cougar", "cougars", "puma", "pumas"],
    medicine: "Mountain Lion moves across the high rocks in near silence, its body a study of power held in perfect balance and control. Its medicine is leadership carried with grace, the ability to lead through presence and example while honoring the freedom of others. Mountain Lion teaches us to step into our authority with courage and to trust the quiet strength within.",
    shadow: "Mountain Lion in shadow can carry the weight of leadership alone, feeling isolated by the expectations of others. We may also struggle with the responsibility of power, either clutching it too tightly or refusing to claim it at all. Mountain Lion invites us to lead from our hearts, balancing our strength with compassion.",
    appears: "When Mountain Lion appears, we may be called into a role of leadership, asked to guide others with courage and integrity. It can also signal a time to claim our personal power and to stand firm in our truth. Mountain Lion reminds us that true leaders inspire through their example.",
    prompt: "Where am I being called to lead, and how can I lead with grace?",
  },
  {
    slug: "jaguar", name: "Jaguar", kind: "mammal", element: "earth", direction: "within",
    essence: "Fearless sovereignty in the heart of the jungle",
    keywords: ["Sovereignty", "Presence", "Inner power"],
    medicine: "Jaguar moves through the dense rainforest at night, its spotted coat dissolving into the dappled shadows, as comfortable in the water as it is in the trees. Its medicine is sovereign presence, the power of one who knows its own territory and moves through the darkness with complete confidence. Jaguar teaches us to reclaim our inner power and to walk through the unknown parts of ourselves with courage.",
    shadow: "Jaguar in shadow can become a solitary power that trusts no one, guarding its territory so fiercely that connection becomes impossible. We may also fear our own intensity, hiding the strength we carry. Jaguar invites us to embrace our power fully and to let it serve love.",
    appears: "When Jaguar appears, we are often being asked to step into our full sovereignty, to claim our space and our voice. It can mark a time of deep inner work, a journey into the hidden places of the psyche. Jaguar reminds us that we can move through any darkness with grace.",
    prompt: "What part of my own power am I ready to reclaim?",
  },
  {
    slug: "lion", name: "Lion", kind: "mammal", element: "fire", direction: "south",
    essence: "The golden heart of courage",
    keywords: ["Courage", "Heart", "Nobility"],
    aliases: ["lioness", "lionesses"],
    medicine: "Lion rests in the golden grass of the savanna, its great mane glowing in the late afternoon sun, and its roar can be heard for miles across the open land. Its medicine is courage that lives in the heart, the noble strength to protect what we love and to stand fully in our power. Lion also teaches the wisdom of rest, the knowledge that true strength knows when to stretch out in the warmth and simply be.",
    shadow: "Lion in shadow can become pride, a need for recognition that turns our natural nobility into dominance. We may also fear our own roar, hiding our voice to avoid conflict. Lion asks us to let our courage serve the whole pride, our family and community.",
    appears: "When Lion appears, we may be called to act with courage in a situation that has made us hesitate. It can be a reminder to honor our worth and to protect what matters most. Lion also invites us to rest and restore, knowing that rest is part of strength.",
    prompt: "What would I do today if my heart were filled with the courage of Lion?",
  },
  {
    slug: "tiger", name: "Tiger", kind: "mammal", element: "fire", direction: "south",
    essence: "Passion, willpower, and fierce devotion",
    keywords: ["Passion", "Willpower", "Vitality"],
    aliases: ["tigress", "tigresses"],
    medicine: "Tiger moves through the tall grass with a focused intensity, its striped coat rippling with each powerful stride. Its medicine is passion guided by willpower, the vital force that fuels our creative fire and drives us toward our dreams. Tiger teaches us to embrace our intensity and to channel it into acts of fierce devotion.",
    shadow: "Tiger in shadow can let its passion burn out of control, acting on impulse and scorching the ground it walks on. We may also suppress our fire, fearing that our intensity will overwhelm others. Tiger invites us to honor our passion and to direct it with wisdom.",
    appears: "When Tiger appears, a fresh surge of energy may be arriving, and we are invited to pursue our desires with courage. It can also be a call to reconnect with our vitality and our creative power. Tiger reminds us that our passion is sacred when guided by love.",
    prompt: "What passion is ready to be channeled into devoted action?",
  },
  {
    slug: "rabbit", name: "Rabbit", kind: "mammal", element: "earth", direction: "east",
    essence: "Fertile abundance and quick intuition",
    keywords: ["Fertility", "Intuition", "Gentle courage"],
    aliases: ["bunny", "bunnies", "hare", "hares"],
    medicine: "Rabbit nibbles at the edge of the meadow in the soft light of evening, ears turning to catch every whisper of sound, ready to leap in an instant. Its medicine is fertile abundance and quick intuition, the gift of sensing what is coming and responding with swift grace. Rabbit also teaches us the creative power of new beginnings, the way small seeds of intention multiply when we tend them with care.",
    shadow: "Rabbit in shadow can become anxious, its sensitive awareness turning into a constant worry about what might go wrong. We may also freeze when we most need to move, paralyzed by the very sensitivity meant to guide us. Rabbit invites us to transmute worry into intuition, trusting the quiet knowing that tells us when to leap.",
    appears: "When Rabbit appears, a season of creativity and new beginnings may be opening, and our ideas are ready to multiply. It can also be a reminder to trust our instincts and act on the opportunities before us. Rabbit asks us to notice where anxiety has been dressing itself as caution.",
    prompt: "What small seed of intention, if tended, could multiply into abundance?",
  },
  {
    slug: "squirrel", name: "Squirrel", kind: "mammal", element: "earth", direction: "east",
    essence: "Preparation, play, and resourcefulness",
    keywords: ["Preparation", "Playfulness", "Resourcefulness"],
    aliases: ["chipmunk", "chipmunks"],
    medicine: "Squirrel races along the branches of the oak with boundless energy, pausing only to bury another acorn in the soft autumn earth. Its medicine is the wisdom of preparation balanced with play, the joy of gathering what we need for the seasons ahead while delighting in the present moment. Squirrel teaches us resourcefulness, the ability to make the most of what is available and to trust our own foresight.",
    shadow: "Squirrel in shadow can become a frantic gatherer, hoarding resources and worrying endlessly about the future. We may also scatter our energy across so many tasks that nothing gets finished. Squirrel invites us to prepare wisely and then release our worry, trusting that we have enough.",
    appears: "When Squirrel appears, we may be called to plan for a coming season, to save, organize, or prepare. It can also be a reminder to bring more playfulness into our days and to stop taking our responsibilities so seriously. Squirrel asks us to balance work and play with joyful lightness.",
    prompt: "What am I gathering for the future, and what am I ready to enjoy right now?",
  },
  {
    slug: "raccoon", name: "Raccoon", kind: "mammal", element: "water", direction: "west",
    essence: "Curious hands and the gift of disguise",
    keywords: ["Curiosity", "Resourcefulness", "Masks"],
    medicine: "Raccoon wanders to the edge of the stream under the moonlight and dips its clever hands into the water, feeling its way through the stones with a curious and careful touch. Its medicine is resourceful curiosity, the ability to explore the world through our senses and to discover what others overlook. Raccoon also teaches the wisdom of the mask, the understanding that we can choose which faces we show to the world and when.",
    shadow: "Raccoon in shadow can hide behind its mask, using disguise to avoid the vulnerability of being truly seen. We may also become so resourceful that we take what belongs to others. Raccoon invites us to remove the masks that no longer serve and to let our authentic face be known.",
    appears: "When Raccoon appears, we may be asked to look closely at the roles we play and the masks we wear. It can also be a call to explore a situation with curiosity, using all our senses. Raccoon reminds us that our resourcefulness can help us thrive in any environment.",
    prompt: "Which mask am I ready to set down?",
  },
  {
    slug: "otter", name: "Otter", kind: "mammal", element: "water", direction: "west",
    essence: "Playful joy in the flow of the river",
    keywords: ["Play", "Joy", "Feminine flow"],
    medicine: "Otter tumbles through the river with a pure and contagious joy, sliding down muddy banks and floating on its back in the sunlight. Its medicine is play as a sacred practice, the reminder that joy and lightness are essential to a life well lived. Otter teaches us to move with the flow of the water, to trust the current, and to delight in the simple pleasures of being alive.",
    shadow: "Otter in shadow can use play to avoid responsibility, staying on the surface where nothing difficult can reach it. We may also lose our joy entirely, becoming so serious that we forget how to float. Otter invites us to balance play with presence.",
    appears: "When Otter appears, we may need more joy and lightness in our lives, and it gently invites us to play. It can also signal a time of emotional openness, a willingness to let our feelings flow freely. Otter reminds us that delight is a form of wisdom.",
    prompt: "When did I last play with the pure delight of Otter, and how can I invite that joy back?",
  },
  {
    slug: "beaver", name: "Beaver", kind: "mammal", element: "water", direction: "west",
    essence: "The builder who shapes the waters of life",
    keywords: ["Building", "Teamwork", "Persistence"],
    medicine: "Beaver works tirelessly at the edge of the stream, gnawing branches and weaving them into dams and lodges that transform the entire landscape around it. Its medicine is the power of the builder, the ability to turn vision into form through patience, teamwork, and steady effort. Beaver teaches us that our dreams become real when we commit to building them, one branch at a time.",
    shadow: "Beaver in shadow can become so focused on building that it forgets to rest and enjoy what it has created. We may also cling to our structures, resisting change even when the waters call us to adapt. Beaver invites us to build with purpose and to remain open to the flow of life.",
    appears: "When Beaver appears, it may be time to turn our ideas into tangible action, building the foundation for a dream. It can also be a call to collaborate with others, sharing the work of creation. Beaver reminds us to balance effort with rest.",
    prompt: "What dream am I ready to begin building, one branch at a time?",
  },
  {
    slug: "bat", name: "Bat", kind: "mammal", element: "air", direction: "below",
    essence: "Rebirth through the darkness",
    keywords: ["Rebirth", "Intuition", "Initiation"],
    ambiguous: true,
    medicine: "Bat emerges from the cave at dusk in a great spiraling cloud, finding its way through the darkness by listening to the echoes of its own voice. Its medicine is rebirth and initiation, the passage through darkness that transforms us into something new. Bat teaches us to trust our inner senses when the outer world feels uncertain.",
    shadow: "Bat in shadow can resist transformation, clinging to old identities even as they dissolve around us. We may also fear the darkness so deeply that we refuse to enter it. Bat invites us to trust the process of rebirth.",
    appears: "When Bat appears, we may be moving through a major transition, shedding an old way of being so that a new one can emerge. It can also be a call to trust our intuition and listen to what echoes back to us. Bat reminds us that every ending is also a beginning.",
    prompt: "What am I being initiated into during this season of my life?",
  },
  {
    slug: "elephant", name: "Elephant", kind: "mammal", element: "earth", direction: "within",
    essence: "Ancient memory and the wisdom of the matriarch",
    keywords: ["Memory", "Wisdom", "Family"],
    medicine: "Elephant walks across the vast plains in a slow and stately procession, the herd led by its eldest mother, who remembers the location of every watering hole across generations. Its medicine is ancient memory and the wisdom of the matriarch, the deep knowing that comes from honoring the past and those who walked before us. Elephant teaches us loyalty, compassion, and the power of a gentle strength that protects all who need it.",
    shadow: "Elephant in shadow can carry old memories as heavy burdens, unable to forgive or release the wounds of the past. We may also become so devoted to family and tradition that we lose our own path. Elephant invites us to honor our memories while allowing them to evolve.",
    appears: "When Elephant appears, we may be called to reconnect with our roots, our ancestors, or the elders in our lives. It can also signal a time to step into our own wisdom and to lead with gentle strength. Elephant reminds us that we carry the memory of all who came before.",
    prompt: "What wisdom from my lineage is ready to be remembered?",
  },
  // ─── Insects and spiders ────────────────────────────────────────────────────
  {
    slug: "butterfly", name: "Butterfly", kind: "insect", element: "air", direction: "east",
    essence: "The living proof of transformation",
    keywords: ["Transformation", "Lightness", "Rebirth"],
    plural: "butterflies",
    aliases: ["caterpillar", "caterpillars", "chrysalis"],
    medicine: "Butterfly drifts across the garden on wings of painted light, and every time we see one we are looking at a creature that has dissolved completely and been remade. Its medicine is transformation in its most luminous form, the reminder that the dark season inside the chrysalis is where our new wings are woven. Butterfly teaches us to trust the stages of our becoming, to honor the caterpillar we were, and to rise into the lightness of who we are becoming.",
    shadow: "Butterfly in shadow can resist the chrysalis, longing for wings while refusing the stillness that grows them. We may also flutter from one change to the next without letting any transformation settle into our bones. Butterfly invites us to surrender to each stage, trusting that the timing of our emergence is wise.",
    appears: "When Butterfly appears, a transformation may be completing itself in our lives, and we are invited to celebrate what we have become. It can also be a gentle sign that a difficult season of change is producing something beautiful. Many people feel Butterfly near after a loss, as a soft reminder that love continues in new forms.",
    prompt: "What stage of transformation am I living in right now, and what is it asking of me?",
  },
  {
    slug: "dragonfly", name: "Dragonfly", kind: "insect", element: "water", direction: "east",
    essence: "Light, illusion, and the shimmer of the true self",
    keywords: ["Illumination", "Seeing through illusion", "Adaptability"],
    plural: "dragonflies",
    medicine: "Dragonfly darts above the surface of the pond, its iridescent wings catching the light and scattering it into shimmering colors that seem to shift with every turn. Its medicine is the illumination of truth, the ability to see through illusion and recognize the light that lives at the center of all things. Dragonfly spends much of its life beneath the water before rising into the air, and it teaches us that our emotional depths prepare us for the clarity that follows.",
    shadow: "Dragonfly in shadow can become lost in its own reflections, mistaking the shimmer of appearances for the deeper truth. We may also hide our true colors, presenting a version of ourselves that feels safer than the real one. Dragonfly invites us to let our authentic light shine through.",
    appears: "When Dragonfly appears, we may be ready to see a situation with new clarity, recognizing the illusions we have been living with. It can also mark a time of emotional maturity, when the lessons of our depths become wings. Dragonfly reminds us that we are made of light.",
    prompt: "What illusion am I ready to see through?",
  },
  {
    slug: "bee", name: "Bee", kind: "insect", element: "air", direction: "south",
    essence: "Sweet devotion and the harmony of the hive",
    keywords: ["Community", "Devotion", "Sweetness"],
    aliases: ["honeybee", "honeybees", "bumblebee", "bumblebees"],
    medicine: "Bee moves from blossom to blossom in the warm hum of summer, gathering nectar and carrying the gift of pollination that keeps the whole garden alive. Its medicine is devoted service and community harmony, the understanding that each of us contributes to a greater whole and that our work can be sweet. Bee teaches us that when we follow our natural purpose, life becomes fertile and abundant for everyone.",
    shadow: "Bee in shadow can become so busy that it forgets to taste the honey it creates, working endlessly without joy. We may also lose ourselves in the needs of the collective, sacrificing our own voice for the good of the hive. Bee invites us to find sweetness in our work and to honor our individual gifts.",
    appears: "When Bee appears, we may be called to focus on a meaningful project with devotion, trusting that our efforts will bear fruit. It can also be a reminder to celebrate the sweetness in our lives. Bee asks us to notice the community that supports us and the ways we support it.",
    prompt: "What work in my life produces sweetness, and how can I savor it?",
  },
  {
    slug: "spider", name: "Spider", kind: "insect", element: "earth", direction: "within",
    essence: "The weaver of fate and creation",
    keywords: ["Creativity", "Weaving", "Patience"],
    medicine: "Spider spins its web in the early morning, and as the dew settles on every silken thread, a perfect geometry appears that seems to hold the entire world in its design. Its medicine is creative weaving, the ability to spin our dreams into form and to recognize the threads that connect all things. Spider teaches us patience and precision, the knowledge that every great creation begins with a single thread.",
    shadow: "Spider in shadow can become entangled in its own web, trapped by patterns of thought or behavior that it once created for protection. We may also weave stories that keep us stuck. Spider invites us to remember that we are the weaver, and that we can always spin something new.",
    appears: "When Spider appears, we may be in a season of creation, invited to weave our ideas into something beautiful. It can also be a call to notice the patterns we have been repeating and to choose a new design. Spider reminds us that we are always creating our lives.",
    prompt: "What am I weaving with my thoughts and choices, and is it the design I want?",
  },
  {
    slug: "ant", name: "Ant", kind: "insect", element: "earth", direction: "below",
    essence: "Patient labor that moves mountains",
    keywords: ["Diligence", "Cooperation", "Patience"],
    medicine: "Ant moves steadily across the forest floor carrying loads many times its own weight, part of a vast community working together to build an underground city. Its medicine is diligent patience, the understanding that great things are built through small consistent efforts and cooperation. Ant teaches us to trust the process, to work steadily toward our goals, and to honor our place within the larger community.",
    shadow: "Ant in shadow can become a relentless worker who has forgotten why it works, carrying burdens without question. We may also lose our individuality in service to the collective. Ant invites us to remember our own purpose and to rest when the work is done.",
    appears: "When Ant appears, we may be asked to commit to a long project with patience and steadiness. It can also be a call to cooperate with others, recognizing that we can accomplish more together. Ant reminds us that every step counts.",
    prompt: "What steady effort, offered each day, could move the mountain in front of me?",
  },
  {
    slug: "moth", name: "Moth", kind: "insect", element: "air", direction: "west",
    essence: "Faith that follows the light through the night",
    keywords: ["Faith", "Intuition", "Hidden beauty"],
    medicine: "Moth flutters through the night on soft and dusty wings, drawn toward the light with an instinct that seems older than memory. Its medicine is faith in the darkness, the ability to follow the faint glow of our deepest longing even when the path cannot be seen. Moth also teaches us about hidden beauty, the intricate patterns that reveal themselves only to those who look closely.",
    shadow: "Moth in shadow can be drawn to a light that harms it, mistaking a dangerous flame for the true source of illumination. We may also follow our desires without discernment. Moth invites us to seek the light that nourishes and to trust the subtle guidance of our intuition.",
    appears: "When Moth appears, we may be navigating a period of uncertainty, asked to follow our inner light with faith. It can also be a call to examine what we are drawn to and whether it truly serves us. Moth reminds us that our intuition is a guiding star.",
    prompt: "What light am I drawn toward, and does it truly nourish me?",
  },
  {
    slug: "ladybug", name: "Ladybug", kind: "insect", element: "fire", direction: "south",
    essence: "Small blessings and the return of good fortune",
    keywords: ["Blessings", "Gratitude", "Renewal"],
    plural: "ladybugs",
    aliases: ["ladybird", "ladybirds"],
    medicine: "Ladybug lands on our hand with the lightest touch, a tiny dome of red and black that has been welcomed by gardeners and children across many cultures as a sign of good fortune. Its medicine is the recognition of small blessings, the gratitude that opens our eyes to the gifts already present in our lives. Ladybug also teaches renewal, the quiet trust that life is restoring itself even when we cannot see it.",
    shadow: "Ladybug in shadow can wait for luck to arrive, forgetting that blessings also come from our own effort and openness. We may also overlook the small gifts while searching for the big ones. Ladybug invites us to celebrate every blessing, however small.",
    appears: "When Ladybug appears, a season of good fortune may be beginning, and we are invited to receive it with gratitude. It can also be a reminder to slow down and enjoy the simple pleasures. Ladybug asks us to trust that life is working in our favor.",
    prompt: "What small blessing arrived today that I almost missed?",
  },
  {
    slug: "firefly", name: "Firefly", kind: "insect", element: "fire", direction: "within",
    essence: "Inner light that glows in the summer dark",
    keywords: ["Inner light", "Inspiration", "Wonder"],
    plural: "fireflies",
    aliases: ["lightning bug", "lightning bugs"],
    medicine: "Firefly rises from the tall grass on warm summer nights, its body pulsing with a soft golden glow that turns an ordinary field into a sky of living stars. Its medicine is the inner light, the radiance that comes from within and illuminates the darkness around us. Firefly teaches us that even the smallest light can inspire wonder, and that our glow is meant to be shared.",
    shadow: "Firefly in shadow can dim its light, fearing that it is too small to matter. We may also wait for permission before we shine. Firefly invites us to let our light flicker freely, trusting that it will find those who need it.",
    appears: "When Firefly appears, we may be called to reconnect with our inner light and with the sense of wonder that brightened our childhood. It can also be a sign of inspiration arriving in small, bright flashes. Firefly reminds us that we carry illumination within.",
    prompt: "What ignites the light within me, and how can I let it glow more brightly?",
  },
  // ─── Water dwellers ─────────────────────────────────────────────────────────
  {
    slug: "dolphin", name: "Dolphin", kind: "water", element: "water", direction: "east",
    essence: "Breath, play, and the joy of connection",
    keywords: ["Breath", "Harmony", "Joyful connection"],
    medicine: "Dolphin leaps from the blue water in a bright arc, breathing deeply at the surface before diving back into the depths, its whole pod moving together in a joyful rhythm. Its medicine is the sacred breath and harmonious connection, the reminder that each breath links our body to our spirit and our hearts to one another. Dolphin teaches us to move through life with playfulness, intelligence, and a deep sense of belonging.",
    shadow: "Dolphin in shadow can lose its breath, forgetting to surface and becoming overwhelmed by the depths of emotion. We may also hide our playful nature beneath layers of seriousness. Dolphin invites us to breathe deeply and to rediscover the joy of connection.",
    appears: "When Dolphin appears, we may be called to return to our breath, to pause and inhale life fully. It can also be a sign that joy and harmony are entering our relationships. Dolphin reminds us that play is a doorway to wisdom.",
    prompt: "How can I bring more breath and play into the way I move through each day?",
  },
  {
    slug: "whale", name: "Whale", kind: "water", element: "water", direction: "below",
    essence: "The ancient song of the deep",
    keywords: ["Ancient memory", "Song", "Emotional depth"],
    aliases: ["orca", "orcas", "humpback", "humpbacks"],
    medicine: "Whale moves through the deep ocean in slow and majestic grace, singing songs that travel for hundreds of miles through the dark water. Its medicine is ancient memory and the power of sound, the reminder that our voices carry vibrations of healing and that the depths hold great wisdom. Whale teaches us to dive into our emotional depths with courage and to listen for the songs that rise from within.",
    shadow: "Whale in shadow can become lost in the depths, overwhelmed by emotions that feel too vast to navigate. We may also silence our song, fearing that it will go unheard. Whale invites us to trust our voice and to surface when we need breath.",
    appears: "When Whale appears, we may be called to explore our emotional depths or to remember something ancient within us. It can also be a call to use our voice, through song, speech, or creative expression. Whale reminds us that we are part of a vast and ancient story.",
    prompt: "What song is rising from the depths of my being?",
  },
  {
    slug: "salmon", name: "Salmon", kind: "water", element: "water", direction: "north",
    essence: "The determined return to the source",
    keywords: ["Determination", "Instinct", "Returning home"],
    medicine: "Salmon swims against the rushing current, leaping up waterfalls with astonishing determination, following an ancient instinct back to the very stream where its life began. Its medicine is the wisdom of the return, the courage to swim upstream toward our source and to honor the call that guides us home. Salmon teaches us determination and trust in our inner compass.",
    shadow: "Salmon in shadow can exhaust itself fighting every current, mistaking struggle for purpose. We may also forget our way home, losing touch with the source that nourishes us. Salmon invites us to follow our instinct with determination while knowing when to rest in the eddies.",
    appears: "When Salmon appears, we may be called to return to our roots, to reconnect with something essential that we have drifted away from. It can also mark a time of determined effort toward a meaningful goal. Salmon reminds us that our instincts know the way home.",
    prompt: "What source within me is calling me home?",
  },
  {
    slug: "octopus", name: "Octopus", kind: "water", element: "water", direction: "within",
    essence: "Fluid intelligence and creative escape",
    keywords: ["Flexibility", "Intelligence", "Camouflage"],
    plural: "octopuses",
    aliases: ["octopi"],
    medicine: "Octopus glides across the ocean floor, changing its color and texture in an instant to blend into the coral and stone, its eight arms exploring the world with a curious intelligence. Its medicine is fluid adaptability, the ability to reshape ourselves, think creatively, and slip through narrow spaces that seem impossible. Octopus teaches us that intelligence can be soft, flexible, and deeply intuitive.",
    shadow: "Octopus in shadow can hide so skillfully that it forgets how to be seen. We may also stretch our attention across too many directions at once, losing our center. Octopus invites us to use our flexibility with intention.",
    appears: "When Octopus appears, we may need to approach a challenge creatively, finding a solution that others cannot see. It can also be a call to adapt to changing circumstances with grace. Octopus reminds us that we are more flexible than we think.",
    prompt: "What creative solution becomes possible if I let myself be fluid?",
  },
  {
    slug: "shark", name: "Shark", kind: "water", element: "water", direction: "south",
    essence: "Instinctive power and forward motion",
    keywords: ["Instinct", "Forward motion", "Clear boundaries"],
    medicine: "Shark moves through the ocean with sleek and silent power, sensing the faintest vibrations in the water and responding with perfect instinct. Its medicine is forward motion and clear instinct, the ability to keep moving toward our goals and to trust the senses that guide us. Shark teaches us to honor our boundaries and to protect our energy.",
    shadow: "Shark in shadow can become aggressive, moving through life in survival mode and treating every encounter as a threat. We may also forget to slow down and rest. Shark invites us to balance our power with presence.",
    appears: "When Shark appears, we may be called to trust our instincts and to move decisively forward. It can also be a reminder to set clear boundaries and protect our energy. Shark asks us to keep swimming.",
    prompt: "What boundary is ready to be drawn with clarity and calm?",
  },
  {
    slug: "seal", name: "Seal", kind: "water", element: "water", direction: "west",
    essence: "Imagination and the call between two worlds",
    keywords: ["Imagination", "Belonging", "Creativity"],
    ambiguous: true,
    aliases: ["selkie", "selkies"],
    medicine: "Seal rests on the rocks in the warm sun before slipping gracefully back into the cold waves, living its life between the land and the sea. Its medicine is imagination and creative longing, the ability to move between the world of form and the world of dreams. Seal teaches us to listen to the call of our deepest desires and to find belonging in both of our worlds.",
    shadow: "Seal in shadow can feel caught between two worlds, belonging fully to neither. We may also ignore the call of our imagination, choosing a life that feels safe while the soul waits on the shore. Seal invites us to honor our longing and let it guide us.",
    appears: "When Seal appears, we may be called to reconnect with our creativity or with a dream we have set aside. It can also be a sign of balancing two worlds, such as work and art or practicality and imagination. Seal reminds us that we belong.",
    prompt: "What longing in my heart has been calling me home?",
  },
  {
    slug: "frog", name: "Frog", kind: "water", element: "water", direction: "west",
    essence: "Cleansing rains and the song of renewal",
    keywords: ["Cleansing", "Renewal", "Transformation"],
    aliases: ["toad", "toads", "tadpole", "tadpoles"],
    medicine: "Frog sings from the edge of the pond after the rain, its voice rising in a chorus that celebrates the return of water to the land. Its medicine is cleansing and renewal, the understanding that tears and rain wash us clean and prepare us for new growth. Frog also teaches us about transformation, as it moves from egg to tadpole to frog in a living spiral of becoming.",
    shadow: "Frog in shadow can sit in stagnant water, holding onto emotions long after they need to be released. We may also resist the cleansing rains, fearing the vulnerability they bring. Frog invites us to let our feelings flow and to trust the renewal that follows.",
    appears: "When Frog appears, we may be in need of emotional cleansing, a time to release old feelings and begin fresh. It can also signal a time of transformation and growth. Frog reminds us that renewal always follows the rain.",
    prompt: "What am I ready to let the rain wash away?",
  },
  {
    slug: "crab", name: "Crab", kind: "water", element: "water", direction: "west",
    essence: "Protection, cycles, and the sideways path",
    keywords: ["Protection", "Cycles", "Indirect path"],
    medicine: "Crab scuttles sideways along the shoreline, its hard shell protecting a soft and sensitive body, moving with the rhythm of the tides. Its medicine is the wisdom of protection and the art of the sideways path, the knowledge that a curving route often arrives with the most wisdom. Crab also teaches us about cycles, as it sheds its shell and grows into a new one.",
    shadow: "Crab in shadow can hide in its shell, using defensiveness to avoid being hurt. We may also cling to an old shell that no longer fits. Crab invites us to release what is too small and to trust that a new form will emerge.",
    appears: "When Crab appears, we may need to protect our sensitive selves while remaining open. It can also be a call to try a different approach, moving sideways around an obstacle. Crab reminds us that growth requires shedding the old.",
    prompt: "What old shell have I outgrown?",
  },
  {
    slug: "seahorse", name: "Seahorse", kind: "water", element: "water", direction: "within",
    essence: "Gentle patience and shared nurturing",
    keywords: ["Patience", "Nurturing", "Gentle strength"],
    aliases: ["sea horse", "sea horses"],
    medicine: "Seahorse drifts through the sea grass with gentle patience, its curled tail anchoring it in place as the currents move around it. Its medicine is gentle strength and shared nurturing, the understanding that caring for new life is a sacred task that can be held by all. Seahorse teaches us to anchor ourselves in what matters and to move through life with patience and grace.",
    shadow: "Seahorse in shadow can cling too tightly to its anchor, resisting the natural flow of change. We may also carry the weight of care alone. Seahorse invites us to share the work of nurturing and to trust the currents.",
    appears: "When Seahorse appears, we may be called to nurture a new project or relationship with patience. It can also be a reminder to anchor ourselves when life feels turbulent. Seahorse asks us to honor the gentle strength within.",
    prompt: "What new life in me or around me is asking for patient nurturing?",
  },
  {
    slug: "jellyfish", name: "Jellyfish", kind: "water", element: "water", direction: "below",
    essence: "Trust in the current and transparent being",
    keywords: ["Flow", "Transparency", "Trust"],
    medicine: "Jellyfish pulses through the open ocean in a translucent bell of light, carried by currents it has learned to trust completely. Its medicine is flow and transparency, the grace of moving through life without resistance and allowing our inner nature to be seen. Jellyfish teaches us that surrender can be a form of strength.",
    shadow: "Jellyfish in shadow can drift aimlessly, letting the currents carry it anywhere without direction. We may also sting when we feel threatened. Jellyfish invites us to balance surrender with intention.",
    appears: "When Jellyfish appears, we may be called to trust the flow of life and release our need for control. It can also be a reminder to be transparent in our relationships. Jellyfish asks us to move gently.",
    prompt: "Where in my life can I trust the current to carry me?",
  },
  // ─── Reptiles and amphibians ────────────────────────────────────────────────
  {
    slug: "snake", name: "Snake", kind: "reptile", element: "fire", direction: "below",
    essence: "Shedding, healing, and the rise of life force",
    keywords: ["Healing", "Shedding", "Life force"],
    aliases: ["serpent", "serpents", "rattlesnake", "rattlesnakes"],
    medicine: "Snake glides across the warm earth in a living wave, feeling the ground through its whole body, and when the season turns it slips out of its old skin and leaves it behind like a ghost of who it used to be. Its medicine is healing through renewal, the sacred power of shedding what has grown too small so that new life can rise. Across many cultures Snake has also been linked with the vital force that coils at the base of the spine and with the healing arts, and we receive it as a teacher of embodiment and transmutation.",
    shadow: "Snake in shadow can hold onto an old skin long past its season, feeling the tightness and discomfort while resisting the vulnerable moment of release. We may also hide in the grass, keeping our power coiled and unseen. Snake invites us to let the shedding happen and to trust the tender new skin beneath.",
    appears: "When Snake appears, a profound transformation may be underway, and we are being invited to release an outworn identity, habit, or belief. It can also signal an awakening of vitality and creative energy. Many people feel Snake near during times of healing, as a sign that the body and spirit are renewing themselves.",
    prompt: "What old skin am I ready to shed?",
  },
  {
    slug: "turtle", name: "Turtle", kind: "reptile", element: "earth", direction: "below",
    essence: "Grounded patience and the wisdom of the earth",
    keywords: ["Patience", "Grounding", "Longevity"],
    aliases: ["tortoise", "tortoises", "sea turtle", "sea turtles"],
    medicine: "Turtle moves across the earth at its own steady pace, carrying its home upon its back, and in many traditions around the world its shell has been seen as an image of the land itself. Its medicine is grounded patience and longevity, the wisdom of moving slowly and steadily toward our goals while staying connected to the earth beneath us. Turtle teaches us that we carry our home within, and that we can retreat into our shell for protection and renewal whenever we need.",
    shadow: "Turtle in shadow can retreat into its shell and refuse to come out, hiding from the world when it feels too much. We may also move so slowly that we miss opportunities. Turtle invites us to honor our pace while remaining open to life.",
    appears: "When Turtle appears, we may be called to slow down, to ground ourselves, and to trust that we will reach our destination in perfect time. It can also be a reminder to protect our energy and to find home within ourselves. Turtle asks us to honor the earth and our connection to it.",
    prompt: "What would change if I trusted my own pace completely?",
  },
  {
    slug: "lizard", name: "Lizard", kind: "reptile", element: "fire", direction: "south",
    essence: "Dreaming awake in the warmth of the sun",
    keywords: ["Dreams", "Regeneration", "Awareness"],
    aliases: ["gecko", "geckos", "iguana", "iguanas"],
    medicine: "Lizard basks on the warm stone in the midday sun, utterly still, its eyes half closed as though it is dreaming the world into being. Its medicine is the wisdom of dreams and regeneration, the ability to access the subtle realms of intuition and to grow back what has been lost. Lizard teaches us to pay attention to our dreams and to trust the subtle messages they carry.",
    shadow: "Lizard in shadow can become lost in dreams, avoiding the realities of waking life. We may also flee when threatened, leaving parts of ourselves behind. Lizard invites us to integrate our dreams with our daily lives.",
    appears: "When Lizard appears, we may be called to pay closer attention to our dreams, both sleeping and waking. It can also signal a time of regeneration, when we recover energy or parts of ourselves that were lost. Lizard reminds us to rest in the warmth.",
    prompt: "What dream has been trying to speak to me?",
  },
  {
    slug: "crocodile", name: "Crocodile", kind: "reptile", element: "water", direction: "below",
    essence: "Primal power and the patience of the ancient",
    keywords: ["Primal power", "Patience", "Ancient wisdom"],
    aliases: ["alligator", "alligators", "gator", "gators"],
    medicine: "Crocodile rests at the edge of the river with only its eyes above the water, ancient and patient, a creature that has watched the world change for millions of years. Its medicine is primal power and ancient patience, the ability to wait for the right moment and then act with full force. Crocodile teaches us to honor our instincts and the old wisdom that lives in our bodies.",
    shadow: "Crocodile in shadow can become a hidden threat, holding resentment beneath the surface until it erupts. We may also fear our own primal nature. Crocodile invites us to embrace our power with awareness.",
    appears: "When Crocodile appears, we may be called to wait patiently for the right moment to act. It can also be a reminder to reconnect with our instincts and our primal strength. Crocodile asks us to honor the ancient wisdom within.",
    prompt: "What ancient wisdom lives in my body, waiting to be heard?",
  },
  {
    slug: "chameleon", name: "Chameleon", kind: "reptile", element: "air", direction: "within",
    essence: "Sensitivity, adaptation, and the patient step",
    keywords: ["Sensitivity", "Adaptation", "Clairvoyance"],
    medicine: "Chameleon moves along the branch with slow and deliberate steps, its colors shifting in response to its surroundings and its eyes turning independently to see in two directions at once. Its medicine is sensitivity and adaptation, the ability to perceive subtle energies and to respond to them with grace. Chameleon teaches us to trust our perception and to move through life with intentional steps.",
    shadow: "Chameleon in shadow can change its colors so often that it forgets its true hue. We may also blend in to avoid being seen. Chameleon invites us to adapt without losing ourselves.",
    appears: "When Chameleon appears, we may be called to trust our sensitivity and our ability to read the energy around us. It can also be a reminder to move slowly and deliberately. Chameleon asks us to remember our true colors.",
    prompt: "Where have I been blending in when I am ready to show my true colors?",
  },
  {
    slug: "salamander", name: "Salamander", kind: "reptile", element: "fire", direction: "within",
    essence: "Spirit of fire and regeneration",
    keywords: ["Fire", "Regeneration", "Transmutation"],
    aliases: ["newt", "newts"],
    medicine: "Salamander slips through the damp leaves of the forest floor, a creature of water that alchemists and storytellers across the ages have imagined as a spirit of living fire. Its medicine is regeneration and transmutation, the remarkable power to heal and regrow what has been lost and to pass through the fires of life renewed. Salamander teaches us that we hold within us the capacity to rebuild ourselves.",
    shadow: "Salamander in shadow can hide from the fire, avoiding the transformation that would heal it. We may also burn ourselves out. Salamander invites us to work with fire wisely.",
    appears: "When Salamander appears, we may be ready to heal and regenerate after a difficult time. It can also be a call to transmute challenges into strength. Salamander reminds us of our resilience.",
    prompt: "What am I ready to regenerate in myself?",
  },
];

export const TOTEMS_BY_SLUG: Record<string, Totem> = Object.fromEntries(TOTEMS.map((t) => [t.slug, t]));

// ─── Finding animals in free text (journal entries, search queries) ──────────
function regularPlural(word: string) {
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + "ies";
  if (/f$/.test(word)) return word.slice(0, -1) + "ves";
  if (/(s|x|ch|sh)$/.test(word)) return word + "es";
  return word + "s";
}

const FORM_TO_SLUG = new Map<string, string>();
const PLURAL_FORMS = new Set<string>();
for (const t of TOTEMS) {
  const base = t.name.toLowerCase();
  const plural = t.plural ?? regularPlural(base);
  FORM_TO_SLUG.set(base, t.slug);
  FORM_TO_SLUG.set(plural, t.slug);
  PLURAL_FORMS.add(plural);
  for (const a of t.aliases ?? []) FORM_TO_SLUG.set(a.toLowerCase(), t.slug);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first so "mountain lion" wins over "lion" and "sea turtle" over "turtle"
const FORMS_PATTERN = Array.from(FORM_TO_SLUG.keys())
  .sort((a, b) => b.length - a.length)
  .map((f) => escape(f).replace(/ /g, "\\s+"))
  .join("|");

const DETERMINER_BEFORE = /\b(a|an|the|this|that|my|our|your|his|her|their|black|brown|grizzly|polar|mother|baby|great|big|little|young|white|wild|spirit)\s+$/i;
const TOTEM_WORD_AFTER = /^\s+(medicine|totem|spirit|energy|cub|cubs|feather|feathers)\b/i;

export interface TotemMatch { start: number; end: number; slug: string }

/** Every animal mention in the text, in order and non overlapping. Runs entirely on device. */
export function findTotemMatches(text: string): TotemMatch[] {
  const out: TotemMatch[] = [];
  if (!text) return out;
  const re = new RegExp(`\\b(${FORMS_PATTERN})\\b`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const form = m[0].toLowerCase().replace(/\s+/g, " ");
    const slug = FORM_TO_SLUG.get(form);
    if (!slug) continue;
    if (TOTEMS_BY_SLUG[slug].ambiguous && !PLURAL_FORMS.has(form)) {
      const before = text.slice(Math.max(0, m.index - 24), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 24);
      if (!DETERMINER_BEFORE.test(before) && !TOTEM_WORD_AFTER.test(after)) continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, slug });
  }
  return out;
}

/** Unique animals mentioned, in order of first appearance. */
export function findTotems(text: string): Totem[] {
  const seen = new Set<string>();
  const out: Totem[] = [];
  for (const { slug } of findTotemMatches(text)) {
    if (!seen.has(slug)) { seen.add(slug); out.push(TOTEMS_BY_SLUG[slug]); }
  }
  return out;
}

const QUERY_FILLER = new Set(["medicine", "totem", "totems", "spirit", "animal", "animals", "power", "the", "a", "an", "of"]);

/** "owl medicine" → Owl. Used by the journal search so the animal name alone is enough. */
export function totemFromQuery(query: string): Totem | null {
  const words = query.toLowerCase().trim().split(/\s+/).filter((w) => w && !QUERY_FILLER.has(w));
  if (!words.length) return null;
  const slug = FORM_TO_SLUG.get(words.join(" "));
  return slug ? TOTEMS_BY_SLUG[slug] : null;
}

/** Library search: every meaningful word must start a word in the name, aliases,
 *  keywords or text. Animals whose name matches come first. */
export function searchTotems(list: Totem[], query: string): Totem[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter((w) => w && !QUERY_FILLER.has(w));
  if (!words.length) return list;
  const scored: { t: Totem; nameHit: boolean }[] = [];
  for (const t of list) {
    const names = [t.name, t.plural ?? "", ...(t.aliases ?? [])].join(" ").toLowerCase();
    const hay = [names, ...t.keywords, t.essence, t.medicine, t.appears, t.element, t.direction, KIND_LABELS[t.kind]]
      .join(" ").toLowerCase().split(/[^a-z]+/);
    if (!words.every((w) => hay.some((h) => h.startsWith(w)))) continue;
    const nameWords = names.split(/[^a-z]+/);
    scored.push({ t, nameHit: words.every((w) => nameWords.some((h) => h.startsWith(w))) });
  }
  return [...scored.filter((s) => s.nameHit), ...scored.filter((s) => !s.nameHit)].map((s) => s.t);
}
