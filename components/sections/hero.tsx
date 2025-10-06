"use client";

import { motion } from "framer-motion";
import { designSystem } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle?: string;
  description: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  variant?: "default" | "gradient" | "minimal";
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  variant = "default",
}: HeroProps) {
  const isGradient = variant === "gradient";

  return (
    <section
      className={`${designSystem.spacing.section} ${
        isGradient ? `bg-gradient-to-br ${designSystem.gradients.primary}` : ""
      } ${isGradient ? "text-primary-foreground" : ""}`}
    >
      <div className={designSystem.spacing.containerNarrow}>
        <div className="text-center">
          {subtitle && (
            <motion.div
              {...designSystem.animations.fadeIn}
              className={`${designSystem.typography.small} font-semibold mb-4 ${
                isGradient
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              {subtitle}
            </motion.div>
          )}

          <motion.h1
            initial={designSystem.animations.fadeInUp.initial}
            animate={designSystem.animations.fadeInUp.animate}
            transition={{
              ...designSystem.animations.fadeInUp.transition,
              delay: 0.1,
            }}
            className={`${designSystem.typography.h1} mb-6 ${
              isGradient ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={designSystem.animations.fadeInUp.initial}
            animate={designSystem.animations.fadeInUp.animate}
            transition={{
              ...designSystem.animations.fadeInUp.transition,
              delay: 0.2,
            }}
            className={`${designSystem.typography.bodyLarge} mb-8 ${
              isGradient
                ? "text-primary-foreground/90"
                : "text-muted-foreground"
            } max-w-2xl mx-auto`}
          >
            {description}
          </motion.p>

          {(primaryCta || secondaryCta) && (
            <motion.div
              initial={designSystem.animations.fadeInUp.initial}
              animate={designSystem.animations.fadeInUp.animate}
              transition={{
                ...designSystem.animations.fadeInUp.transition,
                delay: 0.3,
              }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {primaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant={isGradient ? "secondary" : "default"}
                >
                  <a href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="ml-2" />
                  </a>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant={isGradient ? "outline" : "outline"}
                >
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
