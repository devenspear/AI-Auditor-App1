# How to Create Perfect v0.dev PRDs for This Template

## 🎯 Overview

This guide shows you **exactly** how to prompt v0.dev to generate components that work seamlessly with this agency template's design system.

## 📋 Universal PRD Template

Use this template for **any** component you want to create:

```
Create a [COMPONENT NAME] component for a Next.js 15 + ShadCN project.

REQUIREMENTS:
- Use TypeScript with proper interfaces
- Use ShadCN UI components (shadcn/ui)
- Use Framer Motion for animations
- Support dark/light mode (use CSS variables)
- Make it fully responsive (mobile-first)
- Use Tailwind CSS classes only

DESIGN SYSTEM CONSTRAINTS:
- Colors: Use semantic tokens (primary, secondary, accent, muted-foreground)
- Never hardcode colors (no bg-blue-500, etc.)
- Spacing: Use consistent spacing (p-4, p-6, p-8, etc.)
- Typography: Use font-bold, font-semibold, etc.
- Radius: Use rounded-lg, rounded-xl, etc.

ANIMATION:
- Use Framer Motion's motion components
- Include fadeIn, fadeInUp, or scaleIn effects
- Add viewport={{ once: true }} for scroll animations

SPECIFIC DETAILS:
[Describe your component here]

EXAMPLE OUTPUT STRUCTURE:
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface [ComponentName]Props {
  // Your props here
}

export function [ComponentName]({ ...props }: [ComponentName]Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Component content */}
    </motion.div>
  );
}
```

## 💡 Example PRDs

### Example 1: Feature Cards Section

```
Create a Features component that displays 3 feature cards in a grid.

REQUIREMENTS:
- Use TypeScript with proper interfaces
- Use ShadCN UI Card component
- Use Framer Motion for staggered animations
- Support dark/light mode (use CSS variables)
- Make it fully responsive (mobile-first)
- Use Tailwind CSS classes only

DESIGN SYSTEM CONSTRAINTS:
- Colors: Use bg-card, text-card-foreground, text-muted-foreground
- Never hardcode colors
- Spacing: Use p-6 for card padding, gap-6 for grid gaps
- Typography: Use text-2xl font-bold for titles
- Radius: Use rounded-xl for cards

ANIMATION:
- Stagger the card animations by 0.1s each
- Use fadeInUp effect (opacity: 0, y: 40 → opacity: 1, y: 0)
- Include viewport={{ once: true }}
- Add hover:scale-105 transition

SPECIFIC DETAILS:
- Accept an array of features with { icon, title, description }
- Grid: 1 column on mobile, 3 columns on desktop
- Icon should be from lucide-react
- Include optional title and description above the grid
- Make the entire card clickable (optional href prop)

EXAMPLE OUTPUT STRUCTURE:
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}

interface FeaturesProps {
  title?: string;
  description?: string;
  features: Feature[];
}

export function Features({ title, description, features }: FeaturesProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
        {description && <p className="text-lg text-muted-foreground mb-12">{description}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  {/* Feature content */}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Example 2: Pricing Section

```
Create a Pricing component with 3 pricing tiers.

REQUIREMENTS:
- Use TypeScript with proper interfaces
- Use ShadCN UI Card and Button components
- Use Framer Motion for animations
- Support dark/light mode (use CSS variables)
- Make it fully responsive (mobile-first)
- Use Tailwind CSS classes only

DESIGN SYSTEM CONSTRAINTS:
- Colors: Use bg-card, text-primary, text-muted-foreground
- Highlight "Popular" tier with border-primary border-2
- Never hardcode colors (no text-blue-500)
- Spacing: Use p-8 for card padding
- Typography: Use text-4xl font-bold for price
- Radius: Use rounded-2xl for cards

ANIMATION:
- Middle card (popular) scales in (scale: 0.9 → 1)
- Side cards fade in from left/right
- Stagger by 0.15s
- Add viewport={{ once: true }}

SPECIFIC DETAILS:
- Accept array of tiers: { name, price, interval, features[], isPopular, ctaLabel, ctaHref }
- Display checkmarks for included features (use lucide-react Check icon)
- "Popular" badge on highlighted tier
- Grid: 1 column mobile, 3 columns desktop
- Make CTA button variant="default" for popular, variant="outline" for others

EXAMPLE OUTPUT STRUCTURE:
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  price: number;
  interval: string;
  features: string[];
  isPopular?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

interface PricingProps {
  title?: string;
  description?: string;
  tiers: PricingTier[];
}

export function Pricing({ title, description, tiers }: PricingProps) {
  return (
    <section className="py-16 md:py-24">
      {/* Component implementation */}
    </section>
  );
}
```

### Example 3: Testimonials Carousel

```
Create a Testimonials component with auto-rotating carousel.

REQUIREMENTS:
- Use TypeScript with proper interfaces
- Use ShadCN UI Card component
- Use Framer Motion AnimatePresence for transitions
- Support dark/light mode (use CSS variables)
- Make it fully responsive (mobile-first)
- Use Tailwind CSS classes only
- Auto-rotate every 5 seconds

DESIGN SYSTEM CONSTRAINTS:
- Colors: Use bg-card, text-card-foreground, text-muted-foreground
- Never hardcode colors
- Spacing: Use p-8 for card padding
- Typography: Use text-lg for quote, text-sm for author
- Radius: Use rounded-2xl for cards

ANIMATION:
- Slide transition (x: 100 → 0 → -100)
- Fade during transition
- Duration: 0.5s with easeInOut
- Include navigation dots

SPECIFIC DETAILS:
- Accept array of testimonials: { quote, author, role, company, avatar? }
- Auto-rotate with useState and useEffect
- Include prev/next buttons (lucide-react ChevronLeft/Right)
- Show dots indicator at bottom
- Optional avatar image support
- Pause on hover

EXAMPLE OUTPUT STRUCTURE:
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

interface TestimonialsProps {
  title?: string;
  testimonials: Testimonial[];
}

export function Testimonials({ title, testimonials }: TestimonialsProps) {
  const [current, setCurrent] = useState(0);

  // Auto-rotate logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-16 md:py-24">
      {/* Component implementation */}
    </section>
  );
}
```

## 🔧 Integration Steps

### After Getting v0.dev Component:

1. **Copy the component code**
2. **Determine component type:**
   - Full section? → Save to `components/sections/[name].tsx`
   - Reusable block? → Save to `components/blocks/[name].tsx`
   - UI element? → Already in `components/ui/` from ShadCN

3. **Integrate design system tokens:**
   ```tsx
   // Replace hardcoded values with design system
   import { designSystem } from "@/lib/design-system";

   // Before:
   <div className="py-16 md:py-24">

   // After:
   <div className={designSystem.spacing.section}>
   ```

4. **Use in your page:**
   ```tsx
   import { YourComponent } from "@/components/sections/your-component";

   export default function Page() {
     return (
       <div>
         <YourComponent {...props} />
       </div>
     );
   }
   ```

## 🎨 Color System Reference

**For v0.dev prompts, ALWAYS specify these semantic color classes:**

### Backgrounds
- `bg-background` - Page background
- `bg-card` - Card backgrounds
- `bg-primary` - Primary buttons/accents
- `bg-secondary` - Secondary elements
- `bg-muted` - Subtle backgrounds

### Text
- `text-foreground` - Main text
- `text-muted-foreground` - Secondary text
- `text-primary` - Primary colored text
- `text-primary-foreground` - Text on primary backgrounds

### Borders
- `border-border` - Standard borders
- `border-input` - Input borders
- `border-primary` - Primary colored borders

**❌ NEVER use:** `bg-blue-500`, `text-gray-600`, `border-gray-200`
**✅ ALWAYS use:** Semantic tokens that adapt to theme

## 📏 Spacing System

**Standard spacing patterns to include in prompts:**

### Sections
- `py-16 md:py-24 lg:py-32` - Large sections
- `py-12 md:py-16 lg:py-20` - Medium sections

### Containers
- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` - Standard container
- `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8` - Narrow container

### Gaps
- `gap-4` - Tight spacing
- `gap-6` - Standard spacing
- `gap-8` - Loose spacing
- `gap-12` - Section spacing

## 🎬 Animation Patterns

**Include these animation presets in your v0.dev prompts:**

### Fade In
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Fade In Up
```tsx
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
```

### Scale In
```tsx
initial={{ opacity: 0, scale: 0.8 }}
whileInView={{ opacity: 1, scale: 1 }}
viewport={{ once: true }}
transition={{ duration: 0.6 }}
```

### Stagger Children
```tsx
// Parent
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Child
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

## ✅ Checklist for v0.dev Prompts

Before submitting to v0.dev, make sure your prompt includes:

- [ ] "Use TypeScript with proper interfaces"
- [ ] "Use ShadCN UI components"
- [ ] "Use Framer Motion for animations"
- [ ] "Support dark/light mode (use CSS variables)"
- [ ] "Make it fully responsive (mobile-first)"
- [ ] "Use Tailwind CSS classes only"
- [ ] Specific semantic color tokens (bg-card, text-muted-foreground, etc.)
- [ ] No hardcoded colors (no bg-blue-500, etc.)
- [ ] Animation details (type, duration, viewport settings)
- [ ] Props interface with TypeScript types
- [ ] Responsive breakpoints (mobile, tablet, desktop)

## 🚀 Quick Reference

### Need a new section component?
```
"Create a [Name] section with [description].
Use ShadCN Card, Framer Motion fadeIn, semantic colors (bg-card, text-muted-foreground),
responsive grid (1 col mobile, 3 col desktop), TypeScript interfaces."
```

### Need a new interactive element?
```
"Create a [Name] component with [interaction].
Use ShadCN Button, Framer Motion hover effects, semantic colors,
TypeScript, mobile-first responsive."
```

### Need a complex feature?
```
"Create a [Name] component with [features].
Use ShadCN [components], Framer Motion AnimatePresence,
semantic colors with dark mode support, useState for interactivity,
TypeScript interfaces, fully responsive."
```

---

**Pro Tip:** The more specific you are about using semantic tokens and avoiding hardcoded colors, the better v0.dev will integrate with this template's design system.