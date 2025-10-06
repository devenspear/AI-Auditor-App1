"use client";

import { motion, useInView, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useMotionValue(0);

  useEffect(() => {
    if (!isInView) return;

    const unsubscribe = count.on("change", (latest) => {
      rounded.set(Math.floor(latest));
    });

    const animation = {
      from: 0,
      to: end,
    };

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      count.set(animation.from + (animation.to - animation.from) * easeOutCubic);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrame);
    };
  }, [isInView, count, rounded, end, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={className}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}