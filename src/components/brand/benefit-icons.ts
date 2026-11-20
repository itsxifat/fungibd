import { Bone, Droplet, Dumbbell, HeartPulse, Scale, ShieldCheck, Sparkles, Sprout, Sun, Zap, type LucideIcon } from "lucide-react";
import type { Benefit } from "@/lib/content";

export const BENEFIT_ICONS: Record<Benefit["icon"], LucideIcon> = {
  dumbbell: Dumbbell,
  shield: ShieldCheck,
  heart: HeartPulse,
  scale: Scale,
  droplet: Droplet,
  sun: Sun,
  zap: Zap,
  sparkles: Sparkles,
  sprout: Sprout,
  bone: Bone,
};
