# codream.ai — Design System Reference

Reverse-engineered design palette and UI guidelines for a highly-polished, premium visual aesthetic.

---

## Brand Identity & Typography

*   **Primary Font**: Poppins (Weights: 400 for body, 600 for headings/labels)
*   **Monospace Font**: JetBrains Mono (For codes, logs, and numeric specs)
*   **Primary Brand Color**: `#075fe8` (Vibrant Cobalt Blue)

---

## Core Color Palette

| Token | Hex / Color Value | Purpose |
|-------|-------------------|---------|
| Primary Cobalt | `#075fe8` | Main CTAs & interactive elements |
| Deep Violet | `#7c3aed` | Secondary brand accents & glows |
| Bright Purple | `#a855f7` | Dynamic splash highlights |
| Dark Surface | `#18181b` | Zinc-900 (Page backgrounds/cards) |
| Deepest Dark | `#09090b` | Base black / slate tone |
| Pure Light | `#fafafa` | Page grid text / light background |

---

## Utility Design Patterns

### 1. Glassmorphism (Apple Liquid Glass)
Premium cards use semi-transparent backgrounds with background blur (`backdrop-blur`):
```css
/* Light Glass Card */
.glass-card-light {
  background: linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.045) 44%, rgba(255,255,255,0.012) 100%);
  backdrop-filter: blur(8px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Dark Glass Card */
.glass-card-dark {
  background: linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014) 42%, rgba(255,255,255,0.006) 100%);
  backdrop-filter: blur(8px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 2. Ambient Flow Lines
Pill-shaped color gradients moving slowly in the background to add high-end depth:
*   `mobile-flow-line`: blur(22px), 144px height, translates slowly.
*   `desktop-flow-line`: blur(34px), 168px height, cascades behind glass.

### 3. Background Page Grid
Subtle dotted/lined textures for visual grounding:
```css
.bg-grid-light {
  background-image: linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px);
  background-size: 56px 56px;
}
.bg-grid-dark {
  background-image: linear-gradient(#ffffff06 1px, transparent 1px), linear-gradient(90deg, #ffffff06 1px, transparent 1px);
  background-size: 56px 56px;
}
```

### 4. Dynamic Borders & Accents
Sweeping gradients on micro-elements or divider lines:
*   `accent-border-gradient`: Left-to-right transparent -> Purple -> Blue -> Transparent transition line.

---

## Salone Stars Academy Extensions

| Component | Path | Usage |
|-----------|------|-------|
| `<GlassCard>` | `src/shared/ui/glass-card.tsx` | Content cards — prefer over inline glass styles |
| `<PrimaryButton>` | `src/shared/ui/primary-button.tsx` | CTAs using `brand-primary` |
| `<AppBackground>` | `src/shared/ui/app-background.tsx` | Page shell with flow lines |
| `<SierraLeoneFlagStripe>` | `src/shared/ui/app-background.tsx` | Flag stripe `#0072C6` / white / `#1EB53A` |
