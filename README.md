# Agency Template

A modern Next.js template with ShadCN UI, Framer Motion, and a complete design system. Built for Vercel deployment with zero CSS bugs out of the box.

## 🎯 Why This Template?

This template eliminates 80% of common CSS issues by:
- ✅ Using CSS variables exclusively (no hardcoded colors)
- ✅ Proper theme architecture with `next-themes`
- ✅ Centralized design system configuration
- ✅ Type-safe component patterns
- ✅ Clean separation between styling and logic

## 🚀 Features

- **Next.js 15** - Latest version with App Router
- **ShadCN UI** - Beautiful, accessible components with built-in theme support
- **Framer Motion** - Smooth animations with reusable presets
- **Tailwind CSS v4** - Using modern OKLCH color space
- **TypeScript** - Full type safety
- **Dark Mode** - Automatic theme switching with zero configuration
- **Vercel Ready** - Optimized for Vercel deployment

## 📁 Project Structure

```
agency-template/
├── app/
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx             # Example home page
│   └── globals.css          # Clean CSS with only variables
├── components/
│   ├── sections/            # Page sections
│   │   ├── hero.tsx        # Hero section with variants
│   │   ├── stats.tsx       # Animated stats section
│   │   └── cta.tsx         # Call-to-action section
│   ├── blocks/              # Reusable components
│   │   ├── animated-counter.tsx
│   │   └── stat-card.tsx
│   ├── shared/              # Shared utilities
│   │   └── theme-toggle.tsx
│   └── ui/                  # ShadCN components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   ├── design-system.ts    # Design tokens & animations
│   └── utils.ts            # Utility functions
└── README.md
```

## 🎨 Design System

The `lib/design-system.ts` file contains centralized design tokens:

### Gradients
```typescript
designSystem.gradients.primary    // Theme-aware gradient
designSystem.gradients.warm       // Warm color gradient
designSystem.gradients.cool       // Cool color gradient
```

### Animations
```typescript
designSystem.animations.fadeIn     // Fade in effect
designSystem.animations.fadeInUp   // Fade in from bottom
designSystem.animations.scaleIn    // Scale and fade
```

### Spacing
```typescript
designSystem.spacing.section       // Standard section padding
designSystem.spacing.container     // Max-width container
```

### Typography
```typescript
designSystem.typography.h1         // Responsive heading 1
designSystem.typography.body       // Body text
```

## 🔧 Getting Started

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd agency-template
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

## 📝 Using Components

### Hero Section

```tsx
import { Hero } from "@/components/sections/hero";

<Hero
  variant="gradient"
  subtitle="Your subtitle"
  title="Your amazing title"
  description="Your description"
  primaryCta={{ label: "Get Started", href: "#" }}
  secondaryCta={{ label: "Learn More", href: "#" }}
/>
```

**Variants:** `default`, `gradient`, `minimal`

### Stats Section

```tsx
import { Stats } from "@/components/sections/stats";

<Stats
  title="Our Impact"
  description="Numbers that matter"
  stats={[
    {
      value: 100,
      suffix: "%",
      label: "Success Rate",
      colorClass: "text-blue-500 dark:text-blue-400"
    }
  ]}
  columns={4}
/>
```

**Columns:** `2`, `3`, or `4`

### CTA Section

```tsx
import { Cta } from "@/components/sections/cta";

<Cta
  variant="card"
  title="Ready to start?"
  description="Let's build something great"
  primaryCta={{ label: "Get Started", href: "#" }}
/>
```

**Variants:** `default`, `gradient`, `card`

## 🎯 v0.dev Integration

This template is designed to work seamlessly with [v0.dev](https://v0.dev):

1. **Generate components** in v0.dev
2. **Copy the code** to your project
3. **Use design system tokens** for consistent styling
4. **Add to your pages** instantly

### Example v0.dev Prompt:

> "Create a feature card component with an icon, title, and description. Use the ShadCN card component and make it responsive. Include hover effects with Framer Motion."

Then integrate it using our design system:

```tsx
// Use design tokens instead of hardcoded values
<motion.div {...designSystem.animations.scaleIn}>
  <Card className={designSystem.radius.xl}>
    {/* Your v0.dev generated content */}
  </Card>
</motion.div>
```

## 🎨 Customizing Colors

All colors are defined using CSS variables in `app/globals.css`. To customize:

1. **Light mode colors:** Edit the `:root` section
2. **Dark mode colors:** Edit the `.dark` section
3. **Use OKLCH format** for better color representation

Example:
```css
:root {
  --primary: oklch(0.205 0 0);        /* Your brand color */
  --accent: oklch(0.646 0.222 41.116); /* Accent color */
}
```

## 📦 Adding New ShadCN Components

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
```

## 🚀 Deploying to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Deploy!

## 🔄 Benefits Over Starting from Scratch

| Challenge | Old Way | This Template |
|-----------|---------|---------------|
| Dark mode issues | Hours of debugging | ✅ Works instantly |
| Color conflicts | !important hell | ✅ CSS variables |
| Animation setup | Install & configure | ✅ Ready-to-use presets |
| Component library | Build from scratch | ✅ ShadCN included |
| Design consistency | Manual tracking | ✅ Design system |
| Theme switching | Custom implementation | ✅ next-themes built-in |

## 📚 Key Concepts

### CSS Architecture
- **No hardcoded colors** - Everything uses CSS variables
- **No !important rules** - Proper specificity management
- **Theme-aware** - Colors automatically adapt to light/dark mode

### Component Patterns
- **Composition over configuration** - Build complex UIs from simple blocks
- **Type-safe props** - Full TypeScript support
- **Reusable sections** - Drop in pre-built sections

### Design System
- **Single source of truth** - All design tokens in one file
- **Consistent spacing** - Use spacing system everywhere
- **Animation presets** - Smooth animations without repetition

## 🤝 Best Practices

1. **Always use design system tokens:**
   ```tsx
   // ✅ Good
   <div className={designSystem.spacing.section}>

   // ❌ Avoid
   <div className="py-16 md:py-24">
   ```

2. **Use CSS variables for colors:**
   ```tsx
   // ✅ Good
   <div className="bg-primary text-primary-foreground">

   // ❌ Avoid
   <div className="bg-blue-500 text-white">
   ```

3. **Leverage component variants:**
   ```tsx
   // ✅ Good - variants handle complexity
   <Hero variant="gradient" />

   // ❌ Avoid - inline conditional styling
   <Hero className={theme === 'dark' ? '...' : '...'} />
   ```

## 📄 License

MIT - Feel free to use this template for any project!

---

Built with ❤️ for fast, bug-free web development.
