# Paylocity Compensation Journey - Design System

## Overview

This design system provides two distinct themes optimized for different user preferences and contexts:

| Theme | Mode | Aesthetic | Primary Accent | Use Case |
|-------|------|-----------|----------------|----------|
| **Tactical** | Dark | Defense-tech (Anduril/Palantir) | Gold #d4a845 | Focus mode, reduced eye strain |
| **Artistic** | Light | Warm professional (Zoho) | Orange #e85d04 | Daytime use, print-friendly |

## Quick Reference

### Theme Switching

```html
<!-- Set theme on html element -->
<html data-theme="tactical">  <!-- Dark theme -->
<html data-theme="artistic">  <!-- Light theme (default) -->
```

```javascript
// JavaScript toggle
document.documentElement.setAttribute('data-theme', 'tactical');

// With persistence
localStorage.setItem('theme', 'tactical');
```

### Using Tokens

```css
/* CSS Custom Properties */
.card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    font-family: var(--font-body);
    color: var(--text-primary);
}

.card:hover {
    box-shadow: var(--shadow-hover);
    background: var(--bg-hover);
}
```

---

## Color Tokens

### Background Colors

| Token | Tactical (Dark) | Artistic (Light) | Usage |
|-------|-----------------|------------------|-------|
| `--bg-primary` | #0a0a0b | #faf8f5 | Page background |
| `--bg-secondary` | #111113 | #ffffff | Section backgrounds |
| `--bg-tertiary` | #1a1a1d | #f5f2ed | Sidebar, headers |
| `--bg-card` | #141416 | #ffffff | Card backgrounds |
| `--bg-hover` | #1e1e21 | #f0ebe3 | Hover states |

### Text Colors

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--text-primary` | #e8e8e8 | #2d2a26 | Headings, body text |
| `--text-secondary` | #a0a0a0 | #5c5650 | Secondary info, labels |
| `--text-muted` | #666666 | #8a837a | Placeholders, hints |

### Accent Colors

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--accent-primary` | #d4a845 (Gold) | #e85d04 (Orange) | Primary actions, highlights |
| `--accent-secondary` | #45d48a (Green) | #0096c7 (Teal) | Success, positive values |
| `--accent-tertiary` | #4598d4 (Blue) | #7b2cbf (Purple) | Informational |
| `--accent-warning` | #d45745 (Red) | #d00000 (Red) | Warnings, negative values |

### Border Colors

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--border-color` | #2a2a2d | #e8e2da | Default borders |
| `--border-accent` | #3a3a3d | #d4cdc3 | Emphasized borders |

---

## Chart Colors

For Chart.js and other visualization libraries:

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--chart-grid` | rgba(255,255,255,0.06) | rgba(0,0,0,0.06) | Grid lines |
| `--chart-line-1` | #d4a845 | #e85d04 | Primary data series |
| `--chart-line-2` | #45d48a | #0096c7 | Secondary data series |
| `--chart-fill-1` | rgba(212,168,69,0.15) | rgba(232,93,4,0.12) | Area fill primary |
| `--chart-fill-2` | rgba(69,212,138,0.15) | rgba(0,150,199,0.12) | Area fill secondary |

### Chart.js Example

```javascript
const chartColors = {
    primary: getComputedStyle(document.documentElement)
        .getPropertyValue('--chart-line-1').trim(),
    secondary: getComputedStyle(document.documentElement)
        .getPropertyValue('--chart-line-2').trim()
};

new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + '20'
        }]
    }
});
```

---

## Typography

### Font Families

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--font-display` | Space Grotesk | Libre Baskerville | Headlines, titles |
| `--font-body` | Space Grotesk | Nunito | Body text, UI |
| `--font-mono` | JetBrains Mono | JetBrains Mono | Code, numbers |

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

---

## Border Radius

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--radius-sm` | 2px | 8px | Small elements, badges |
| `--radius-md` | 4px | 12px | Buttons, inputs |
| `--radius-lg` | 6px | 16px | Cards, modals |

**Design Note**: Tactical uses sharp corners for a precise, technical feel. Artistic uses softer corners for warmth and approachability.

---

## Shadows

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--shadow-card` | 0 4px 24px rgba(0,0,0,0.4) | 0 4px 20px rgba(45,42,38,0.08) | Default elevation |
| `--shadow-hover` | 0 8px 32px rgba(0,0,0,0.6) | 0 8px 30px rgba(45,42,38,0.12) | Hover/focus state |

---

## Effects

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--glow-primary` | 0 0 20px rgba(212,168,69,0.3) | none | Primary accent glow |
| `--glow-secondary` | 0 0 20px rgba(69,212,138,0.3) | none | Secondary accent glow |

**Design Note**: Glows are disabled in Artistic theme to maintain a clean, professional appearance.

---

## Tooltip Styling

| Token | Tactical | Artistic | Usage |
|-------|----------|----------|-------|
| `--tooltip-bg` | #1a1a1d | #ffffff | Tooltip background |
| `--tooltip-border` | #3a3a3d | #e8e2da | Tooltip border |

---

## Component Patterns

### Card

```css
.card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    padding: 1.5rem;
    transition: all var(--transition-speed);
}

.card:hover {
    box-shadow: var(--shadow-hover);
    border-color: var(--border-accent);
}
```

### Button (Primary)

```css
.btn-primary {
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 0.75rem 1.5rem;
    font-family: var(--font-body);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-speed);
}

[data-theme="tactical"] .btn-primary:hover {
    box-shadow: var(--glow-primary);
}

[data-theme="artistic"] .btn-primary:hover {
    filter: brightness(1.1);
}
```

### Input

```css
.input {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    font-family: var(--font-mono);
    color: var(--text-primary);
    transition: border-color var(--transition-speed);
}

.input:focus {
    outline: none;
    border-color: var(--accent-primary);
}
```

---

## Files

| File | Purpose |
|------|---------|
| `design-system.json` | Master configuration (machine-readable) |
| `tokens/tokens.css` | CSS custom properties (importable) |
| `tokens/tokens.js` | JavaScript module for programmatic access |
| `docs/design-system.md` | This documentation |

---

## Migration Notes

The tokens in this design system were extracted from `index.html`. The source file still contains the original inline styles. Options for future work:

1. **Keep inline** (current): Single-file simplicity, no build step needed
2. **Import external**: `@import '.ui-design/tokens/tokens.css'` for multi-file projects
3. **Build process**: Use `design-system.json` to generate tokens for different platforms

---

## Accessibility

Both themes meet WCAG AA contrast requirements:

- **Tactical**: Light text (#e8e8e8) on dark backgrounds (#0a0a0b) = 15.5:1 ratio
- **Artistic**: Dark text (#2d2a26) on light backgrounds (#faf8f5) = 12.8:1 ratio

Accent colors are chosen for sufficient contrast in their typical use contexts.
