---
name: Terminal Ledger
colors:
  surface: '#0c150f'
  surface-dim: '#0c150f'
  surface-bright: '#323c33'
  surface-container-lowest: '#07100a'
  surface-container-low: '#141e17'
  surface-container: '#18221a'
  surface-container-high: '#232c25'
  surface-container-highest: '#2d372f'
  on-surface: '#dae5da'
  on-surface-variant: '#b9cbbb'
  inverse-surface: '#dae5da'
  inverse-on-surface: '#29332b'
  outline: '#849586'
  outline-variant: '#3b4b3e'
  surface-tint: '#00e383'
  primary: '#f2fff1'
  on-primary: '#00391d'
  primary-container: '#00ff94'
  on-primary-container: '#00713f'
  inverse-primary: '#006d3c'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#fffbf9'
  on-tertiary: '#3c2f00'
  tertiary-container: '#ffdc71'
  on-tertiary-container: '#775f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#5bffa1'
  primary-fixed-dim: '#00e383'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#ffe085'
  tertiary-fixed-dim: '#e5c45b'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#0c150f'
  on-background: '#dae5da'
  surface-variant: '#2d372f'
typography:
  headline-xl:
    fontFamily: JetBrains Mono
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  headline-xl-mobile:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1280px
---

## Brand & Style
The design system is rooted in the aesthetic of high-stakes cryptographic infrastructure. It evokes a sense of "Obsidian Precision"—a UI that feels like a secure, high-performance terminal. The target audience is privacy-focused developers and institutional operators who value speed, technical transparency, and absolute clarity.

The style is **Technocratic Minimalism**. It leverages high-contrast accents against a void-like background to direct attention to cryptographic states. Visual flair is restricted to functional indicators: "Arkiv" (Neon Green) for system health and "Nox" (Cyber Gold) for security status. This is not a consumer app; it is a tool for managing digital truth.

## Colors
The palette is built on a foundation of absolute blacks to maximize the "glowing" effect of technical states.

- **Primary (Arkiv Green):** Used for verified actions, successful transactions, and "Active" infrastructure states.
- **Secondary (Nox Gold):** Reserved for encryption states, unlocked wallets, and security-sensitive warnings.
- **Surface Tiers:** Use #161618 (Charcoal) for container backgrounds to provide subtle separation from the #0A0A0B (Matte Black) canvas.
- **Status Tones:** Secondary text uses Slate (#94A3B8) to ensure high-priority data remains the focal point.

## Typography
This design system employs a dual-font strategy to balance technical utility with long-form readability.

- **JetBrains Mono:** Used for all headers, numerical data, and labels. Its monospaced nature ensures that ledger values align vertically, facilitating quick audits of transactional data.
- **Inter:** Used for body copy and instructional text. Its neutral, humanist qualities provide a relief from the rigid technical feel of the headers, improving legibility for complex privacy policies or descriptions.
- **Formatting:** Use uppercase for labels to emphasize the "System Console" aesthetic.

## Layout & Spacing
The layout follows a strict **Fixed Grid** model. Elements are aligned to an 8px baseline to maintain structural integrity.

- **Grid:** 12-column system for desktop; 4-column for mobile.
- **Rhythm:** Information density is high. Use tight spacing (8px-16px) between related data points to mimic technical spreadsheets, but use wide margins (32px+) between major functional sections to prevent visual clutter.
- **Dividers:** Use 1px solid borders in #161618 for structural separation instead of whitespace where containment is necessary.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Active Glows** rather than traditional shadows.

- **Stacking:** The background (#0A0A0B) is the lowest level. Card and ledger containers use #161618. 
- **Accents:** Active or "Unlocked" states are indicated by a 1px solid border of Primary or Secondary color. 
- **The "Glow":** For critical states (like an Unlocked Ledger), apply a subtle `box-shadow` using the accent color with a high blur radius (12px-20px) and low opacity (0.2) to simulate an emissive hardware light.
- **Borders:** All interactive elements should feature a thin 1px border. Default state is #334155; active state is the primary accent.

## Shapes
The shape language is strictly **Sharp (0px)**. 

To reinforce the architectural and cryptographic nature of the ledger, every component—from buttons to cards to badges—must have 90-degree corners. This evokes the feel of a terminal window or a hardware module. Under no circumstances should rounded corners be introduced, as they soften the professional, technical edge required by the brand narrative.

## Components
Consistent technical styling for core UI elements:

- **Buttons:** 
  - *Primary:* Solid #00FF94 with Black text. Sharp corners.
  - *Ghost:* Transparent background, 1px border of #00FF94 or White, Sharp corners.
- **Badges (Status Indicators):** 
  - *Encrypted:* White border, White mono text, 10px size.
  - *Decrypted:* Cyber Gold border, Cyber Gold mono text.
  - *Pending:* Slate border, Slate mono text.
- **Ledger Rows:** 
  - High-density rows with 1px bottom borders. Use JetBrains Mono for all numeric values. Hover state shifts the background to #1C1C1E.
- **Input Fields:** 
  - Deep black background, 1px Slate border. On focus, border changes to Neon Green or Cyber Gold with a faint outer glow. Use monospaced font for all input values.
- **Cards:** 
  - Background #161618. No shadow. 1px border of #334155. Title must be JetBrains Mono Bold.