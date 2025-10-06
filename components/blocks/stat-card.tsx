"use client";

import { motion } from "framer-motion";
import { designSystem } from "@/lib/design-system";
import { AnimatedCounter } from "./animated-counter";

interface StatCardProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  colorClass?: string;
  delay?: number;
}

export function StatCard({
  value,
  label,
  prefix = "",
  suffix = "",
  description,
  colorClass = "text-primary",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={designSystem.animations.fadeInUp.initial}
      whileInView={designSystem.animations.fadeInUp.animate}
      viewport={{ once: true }}
      transition={{ ...designSystem.animations.fadeInUp.transition, delay }}
      className="text-center"
    >
      <div className={`text-5xl lg:text-6xl font-bold ${colorClass} mb-2`}>
        <AnimatedCounter end={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="text-xl font-semibold text-foreground mb-1">{label}</div>
      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
    </motion.div>
  );
}