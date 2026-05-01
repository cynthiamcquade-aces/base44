import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const affirmations = [
  "Your gifts are meant to be seen. Step into the light today.",
  "Bold action begins with a single, small step forward.",
  "The world is waiting for the greatness already inside you.",
  "Fear is just a sign you're about to grow. Move toward it.",
  "You were designed for visibility. Shine without apology.",
  "Every seed of greatness needs light to bloom. Be the light.",
  "What feels impossible today will be your testimony tomorrow.",
];

export default function WelcomeHero() {
  const [user, setUser] = useState(null);
  const [affirmation] = useState(
    affirmations[Math.floor(Math.random() * affirmations.length)]
  );

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "Beautiful Soul";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 p-8 sm:p-10"
    >
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="w-24 h-24 text-primary" />
      </div>
      <div className="relative">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          Welcome back
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-4">
          {firstName}
        </h1>
        <p className="font-heading italic text-lg text-muted-foreground max-w-lg leading-relaxed">
          "{affirmation}"
        </p>
      </div>
    </motion.div>
  );
}