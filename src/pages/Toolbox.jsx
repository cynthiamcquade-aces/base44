import { useState, useEffect } from "react";
import CustomToolSection from "../components/toolbox/CustomToolSection";
import ToolDetailModal from "../components/toolbox/ToolDetailModal";
import RoadsideToolkit from "../components/toolbox/RoadsideToolkit";
import ExerciseGrid from "../components/toolbox/ExerciseGrid";
import ColorLegend from "../components/toolbox/ColorLegend";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { UserEntities } from "@/lib/userEntities";

const CATEGORIES = [
  {
    id: "somatic",
    emoji: "🌿",
    title: "Somatic Healing",
    tagline: "Release tension stored in your body",
    exercises: [
      {
        id: "somatic-body-scan",
        emoji: "👁️",
        title: "Body Scan",
        defaultColor: "sky",
        tagline: "Tune into where you're holding tension",
        steps: ["Close your eyes. Starting from your toes, notice each area of your body. Where do you feel tension? Breathe into that space for 3 deep breaths."],
      },
      {
        id: "somatic-shake",
        emoji: "🫨",
        title: "Shake It Off",
        defaultColor: "rose",
        tagline: "Physically release stored stress",
        steps: ["Stand up and shake your entire body for 60 seconds. Arms, legs, torso — let it all go. This releases stored stress hormones."],
      },
      {
        id: "somatic-butterfly",
        emoji: "🦋",
        title: "Butterfly Hug",
        defaultColor: "gold",
        tagline: "Calm your nervous system",
        steps: ["Cross your arms over your chest and alternately tap your shoulders slowly. This activates bilateral stimulation and calms your nervous system."],
      },
      {
        id: "somatic-grounding",
        emoji: "🌱",
        title: "5-4-3-2-1 Grounding",
        defaultColor: "sage",
        tagline: "Return to the present moment",
        steps: ["Name 5 things you see, 4 you can hear, 3 you can physically feel, 2 you can smell, 1 you can taste. This brings you back to the present moment."],
      },
      {
        id: "somatic-breathe",
        emoji: "💨",
        title: "BREATHE",
        defaultColor: "gold",
        tagline: "Your body is trying to help you",
        steps: ["Your body is actually trying to help you. Breathing calms the nervous system by sending signals that allow the 'thinking' brain to come back online.\n\nSlow, deep breaths in through the nose, out through the mouth. Try 4 counts in, hold 4, out 4.\n\n(Feel free to roll your eyes — your body won't mind.)"],
      },
      {
        id: "somatic-body-awareness",
        emoji: "🤲",
        title: "Body Awareness",
        defaultColor: "sage",
        tagline: "Name it to tame it",
        steps: ["Notice where you feel the anxiety in your body. Is it your chest, stomach, jaw? Place your hand there.\n\nAcknowledge it: 'I see you. I feel you. You are trying to protect me.'\n\nThis takes the power away from the feeling by naming it without judging it."],
      },
      {
        id: "somatic-reframe",
        emoji: "🔄",
        title: "Reframe the Thought",
        defaultColor: "sky",
        tagline: "Turn fear into a compassionate truth",
        steps: ["Write down the anxious thought exactly as it is.\n\nThen ask: Is this fact or fear? What would I tell a close friend thinking this?\n\nRewrite the thought as something more compassionate and true. Say the new version aloud."],
      },
      {
        id: "somatic-next-step",
        emoji: "👣",
        title: "Choose Your Next Step",
        defaultColor: "sage",
        tagline: "One small action signals safety",
        steps: ["Anxiety grows when we feel out of control. Regain your footing by identifying just ONE small thing you can do right now.\n\nNot the whole solution — just one step. Action, even tiny action, signals safety to your nervous system."],
      },
    ],
  },
  {
    id: "nlp",
    emoji: "🧠",
    title: "NLP Techniques",
    tagline: "Rewrite the stories that limit you",
    exercises: [
      {
        id: "nlp-reframe",
        emoji: "✍️",
        title: "Reframe",
        defaultColor: "sky",
        tagline: "Turn a limiting belief into a new truth",
        steps: ["Write down a limiting belief. Now rewrite it as an empowering truth. Say the new version aloud 3 times."],
      },
      {
        id: "nlp-future-self",
        emoji: "🔮",
        title: "Future Self Visualization",
        defaultColor: "lavender",
        tagline: "See yourself 6 months ahead",
        steps: ["Close your eyes and see yourself 6 months from now, fully visible. What are you wearing? Where are you? How do you feel? Describe it in detail."],
      },
      {
        id: "nlp-anchor",
        emoji: "⚓",
        title: "Anchor State",
        defaultColor: "gold",
        tagline: "Access confidence on demand",
        steps: ["Remember a time you felt completely confident. Press your thumb and finger together while reliving that feeling. Practice this anchor daily."],
      },
      {
        id: "nlp-pattern-interrupt",
        emoji: "🛑",
        title: "Pattern Interrupt",
        defaultColor: "gold",
        tagline: "Stop a negative thought in its tracks",
        steps: ["When a negative thought appears, say 'STOP' aloud, clap, then replace it with your chosen affirmation."],
      },
    ],
  },
  {
    id: "prayer",
    emoji: "🙏",
    title: "Prayer & Reflection",
    tagline: "Connect to your source of strength",
    exercises: [
      {
        id: "prayer-surrender",
        emoji: "🌅",
        title: "Morning Surrender",
        defaultColor: "sky",
        tagline: "Start the day with intention",
        steps: ["Before checking your phone, spend 3 minutes in prayer or quiet reflection. Ask: 'What would you have me do today?'"],
      },
      {
        id: "prayer-gratitude",
        emoji: "🌟",
        title: "Gratitude List",
        defaultColor: "peach",
        tagline: "Anchor yourself in what's good",
        steps: ["Write 3 things you're grateful for, 2 things you're proud of, and 1 thing you're excited about."],
      },
      {
        id: "prayer-evening",
        emoji: "🌙",
        title: "Evening Review",
        defaultColor: "sky",
        tagline: "End the day with awareness",
        steps: ["Before sleep, reflect: Where did I step out in courage today? Where did I hold back? No judgment — just awareness."],
      },
      {
        id: "prayer-meditation",
        emoji: "📖",
        title: "Scripture / Affirmation Meditation",
        defaultColor: "lavender",
        tagline: "Let a truth sink into your spirit",
        steps: ["Choose one meaningful verse or affirmation. Sit with it for 5 minutes, letting it sink into your spirit."],
      },
    ],
  },
  {
    id: "art",
    emoji: "🎨",
    title: "Creative Expression",
    tagline: "Unlock blocks through creativity",
    exercises: [
      {
        id: "art-stream",
        emoji: "✏️",
        title: "Stream of Consciousness Drawing",
        defaultColor: "peach",
        tagline: "Let your hand move freely",
        steps: ["Set a timer for 5 minutes. Draw whatever comes to mind without lifting your pen. Don't judge — just flow."],
      },
      {
        id: "art-collage",
        emoji: "✂️",
        title: "Vision Collage",
        defaultColor: "peach",
        tagline: "Make your future visible",
        steps: ["Cut out images and words from magazines that represent your visible, bold future self. Arrange them on paper."],
      },
      {
        id: "art-movement",
        emoji: "💃",
        title: "Movement Expression",
        defaultColor: "rose",
        tagline: "Let your body speak",
        steps: ["Put on a song that makes you feel powerful. Dance like nobody's watching. Let your body express what words can't."],
      },
      {
        id: "art-color-mood",
        emoji: "🖍️",
        title: "Color Your Mood",
        defaultColor: "peach",
        tagline: "Express what you feel in color",
        steps: ["Grab colored pencils. Choose colors that represent how you feel right now. Fill a page with those colors. Notice what shifts."],
      },
    ],
  },
  {
    id: "shadow",
    emoji: "🌑",
    title: "Shadow Work",
    tagline: "Face what's been hiding in the dark",
    exercises: [
      {
        id: "shadow-fear-letter",
        emoji: "✉️",
        title: "The Fear Letter",
        defaultColor: "peach",
        tagline: "Write to your fear directly",
        steps: ["Write a letter TO your fear. Tell it exactly what you think of it and why you're choosing to move forward anyway."],
      },
      {
        id: "shadow-root-cause",
        emoji: "🔍",
        title: "Root Cause Dig",
        defaultColor: "lavender",
        tagline: "Find what's really underneath",
        steps: ["Ask yourself 'Why am I afraid of being visible?' Then ask 'Why?' to each answer, 5 times deep. The root will surprise you."],
      },
      {
        id: "shadow-inner-child",
        emoji: "👶",
        title: "Inner Child Check-In",
        defaultColor: "lavender",
        tagline: "What does young you need to hear?",
        steps: ["Close your eyes and picture yourself at age 7. What does that child need to hear? Say it out loud."],
      },
      {
        id: "shadow-mirror",
        emoji: "🪞",
        title: "Mirror Work",
        defaultColor: "lavender",
        tagline: "See yourself with new eyes",
        steps: ["Look into your own eyes in a mirror for 2 minutes. Say: 'I see you. I accept you. You are worthy of being seen.'"],
      },
    ],
  },
  {
    id: "wellness",
    emoji: "💚",
    title: "Healthy Lifestyle",
    tagline: "Your vessel needs care to carry your gifts",
    exercises: [
      {
        id: "wellness-walk",
        emoji: "🚶",
        title: "10-Minute Walk",
        defaultColor: "rose",
        tagline: "Clear mental fog and boost creativity",
        steps: ["Step outside and walk for 10 minutes. Notice nature around you. This clears mental fog and boosts creativity."],
      },
      {
        id: "wellness-hydration",
        emoji: "💧",
        title: "Hydration Check",
        defaultColor: "sage",
        tagline: "Your brain needs water to perform",
        steps: ["Drink a full glass of water right now. Set 3 alarms today to remind you to hydrate. Your brain needs it."],
      },
      {
        id: "wellness-sleep",
        emoji: "😴",
        title: "Sleep Ritual",
        defaultColor: "sky",
        tagline: "Quality sleep fuels bold action",
        steps: ["30 minutes before bed, put away screens. Read, journal, or do gentle stretching. Quality sleep fuels bold action."],
      },
      {
        id: "wellness-nourish",
        emoji: "🥗",
        title: "Nourish One Meal",
        defaultColor: "sky",
        tagline: "Fuel your body like the gift it is",
        steps: ["Make one meal today extra nutritious. Eat it slowly and with gratitude. Fuel your body like the gift it is."],
      },
    ],
  },
];

export default function Toolbox() {
  const [activeTool, setActiveTool] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("tools");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const loadEntries = () => {
    UserEntities.ToolboxEntry.list().then(setEntries).catch(() => {});
  };

  useEffect(() => { loadEntries(); }, []);

  const getEntry = (toolId) => entries.find((e) => e.tool_id === toolId);

  const handleRemoveFromKit = async (entry) => {
    await base44.entities.ToolboxEntry.update(entry.id, { in_roadside_kit: false });
    loadEntries();
  };

  const handleKitToolSelect = (entry) => {
    for (const cat of CATEGORIES) {
      const ex = cat.exercises.find((e) => e.id === entry.tool_id);
      if (ex) { setActiveTool(ex); return; }
    }
    // Fallback: construct tool from entry data (e.g. custom tools or mismatched ids)
    setActiveTool({
      id: entry.tool_id,
      title: entry.tool_title,
      emoji: entry.tool_emoji || "🛠️",
      tagline: "",
      steps: [],
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Your Toolbox</h1>
        <p className="text-muted-foreground text-sm mt-1">
          A blend of powerful techniques to help you break through and shine.
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("tools"); setSelectedCategory(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "tools" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          🛠️ All Tools
        </button>
        <button
          onClick={() => setActiveTab("kit")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "kit" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          🧰 The Recalibration Kit
          {entries.filter((e) => e.in_roadside_kit).length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === "kit" ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"
            }`}>
              {entries.filter((e) => e.in_roadside_kit).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "kit" && (
        <RoadsideToolkit
          entries={entries}
          onSelectTool={handleKitToolSelect}
          onRemove={handleRemoveFromKit}
        />
      )}

      {activeTab === "tools" && (
        <>
          {!selectedCategory && (
            <div className="space-y-4">
              <ColorLegend />
              <div className="grid sm:grid-cols-2 gap-4">
                {CATEGORIES.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedCategory(cat)}
                    className="bg-card rounded-xl border border-border p-6 text-left hover:shadow-sm hover:border-primary/30 transition-all group"
                  >
                    <span className="text-3xl">{cat.emoji}</span>
                    <h3 className="font-heading text-lg font-medium mt-3">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.tagline}</p>
                    <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-3">
                      {cat.exercises.length} exercises <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                All Tools
              </button>
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  {selectedCategory.emoji} {selectedCategory.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">{selectedCategory.tagline}</p>
              </div>
              <ColorLegend />
              <ExerciseGrid
                exercises={selectedCategory.exercises}
                entries={entries}
                onSelect={setActiveTool}
              />
            </div>
          )}

          <div className="border-t border-border pt-8">
            <CustomToolSection />
          </div>
        </>
      )}

      <AnimatePresence>
        {activeTool && (
          <ToolDetailModal
            tool={activeTool}
            toolSource="builtin"
            existingEntry={getEntry(activeTool.id)}
            onClose={() => setActiveTool(null)}
            onSaved={loadEntries}
          />
        )}
      </AnimatePresence>
    </div>
  );
}