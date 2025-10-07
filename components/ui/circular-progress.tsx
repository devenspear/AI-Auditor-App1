"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  delay?: number;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showValue = true,
  label,
  delay = 0,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 90) return "hsl(142 76% 36%)"; // green
    if (score >= 70) return "hsl(47 96% 53%)"; // yellow
    if (score >= 50) return "hsl(25 95% 53%)"; // orange
    return "hsl(0 84% 60%)"; // red
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: delay / 1000,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: (delay + 500) / 1000,
            }}
          >
            {Math.round(value)}
          </motion.span>
          {label && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
