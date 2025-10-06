/**
 * Design System Configuration
 *
 * Centralized design tokens for consistent styling across the application.
 * All values use Tailwind classes that map to CSS variables for theme support.
 */

export const designSystem = {
  /**
   * Gradient definitions for backgrounds and text
   * These automatically adapt to light/dark mode through CSS variables
   */
  gradients: {
    primary: "from-primary via-primary/80 to-accent",
    secondary: "from-secondary via-accent to-secondary",
    accent: "from-accent to-primary",
    warm: "from-orange-500 via-red-500 to-pink-500",
    cool: "from-blue-500 via-cyan-500 to-teal-500",
    purple: "from-purple-500 via-pink-500 to-rose-500",
    success: "from-green-500 to-emerald-500",
  },

  /**
   * Framer Motion animation presets
   * Use these for consistent animations across components
   */
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    fadeInUp: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: "easeOut" }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    slideInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    slideInRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
  },

  /**
   * Spacing system for sections and containers
   * Consistent spacing creates visual rhythm
   */
  spacing: {
    section: "py-16 md:py-24 lg:py-32",
    sectionSm: "py-12 md:py-16 lg:py-20",
    sectionLg: "py-24 md:py-32 lg:py-40",
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    containerNarrow: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8",
    containerWide: "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8",
  },

  /**
   * Typography scales
   * Responsive font sizes for different heading levels
   */
  typography: {
    h1: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight",
    h2: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight",
    h3: "text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight",
    h4: "text-xl md:text-2xl lg:text-3xl font-semibold",
    body: "text-base md:text-lg",
    bodyLarge: "text-lg md:text-xl",
    small: "text-sm md:text-base",
  },

  /**
   * Border radius presets
   * Consistent rounded corners
   */
  radius: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  },
} as const;

/**
 * Type-safe helper to get design system values
 */
export type DesignSystemGradient = keyof typeof designSystem.gradients;
export type DesignSystemAnimation = keyof typeof designSystem.animations;
export type DesignSystemSpacing = keyof typeof designSystem.spacing;
export type DesignSystemTypography = keyof typeof designSystem.typography;