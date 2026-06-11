---
name: ConstructPro Precise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf6'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d3e3ff'
  on-surface: '#0b1c30'
  on-surface-variant: '#434751'
  inverse-surface: '#213146'
  inverse-on-surface: '#ebf1ff'
  outline: '#737783'
  outline-variant: '#c3c6d3'
  surface-tint: '#2d5cad'
  primary: '#002c66'
  on-primary: '#ffffff'
  primary-container: '#004191'
  on-primary-container: '#8db1ff'
  inverse-primary: '#aec6ff'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#738fff'
  on-secondary-container: '#002380'
  tertiary: '#2b2f30'
  on-tertiary: '#ffffff'
  tertiary-container: '#414546'
  on-tertiary-container: '#afb2b3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#D8E2FF'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#064494'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173baa'
  tertiary-fixed: '#e0e3e4'
  tertiary-fixed-dim: '#c4c7c8'
  on-tertiary-fixed: '#181c1d'
  on-tertiary-fixed-variant: '#434748'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e3ff'
  surface-bg: '#F1F5F9'
  glass-border: '#E2E8F0'
  risk-low: '#10B981'
  risk-medium: '#F59E0B'
  risk-high: '#BA1A1A'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  currency-display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  section-gap: 32px
  element-gap: 12px
  card-padding: 24px
  gutter: 20px
  container-margin: 24px
  navbar-height: 72px
---

## Brand & Style

The brand identity for ConstructPro ERP is rooted in **Corporate Modernism** with a distinct **Glassmorphic** layer for high-end utility. It targets construction executives and project managers who require absolute precision, reliability, and high operational visibility. 

The aesthetic is characterized by a "Glass-on-Steel" feel: ultra-clean white surfaces (steel) layered with semi-transparent, blurred navigation and interaction zones (glass). The mood is professional, systematic, and data-driven, utilizing a cool-toned palette to evoke stability and technological sophistication. Heavy emphasis is placed on structural grid alignment and subtle depth to organize complex information architectures without overwhelming the user.

## Colors

The color system uses a high-fidelity "Fidelity" variant of Material 3 principles, optimized for professional software.

- **Primary & Secondary:** Deep indigos and navy blues serve as the foundation, used for primary actions, branding, and active navigational states.
- **Surface Palette:** The background utilizes a cool slate-grey (`#F1F5F9`) to reduce eye strain, while cards and containers use pure white (`#FFFFFF`) to pop against the background.
- **Functional Accents:** A specific "Risk" palette is defined for operational statuses: Emerald for low risk, Amber for medium, and Deep Red for high-risk alerts.
- **Glass Effects:** Borders for translucent elements use a soft light grey (`#E2E8F0`) to define edges against varied backgrounds.

## Typography

The system relies exclusively on **Inter** to maintain a utilitarian, Swiss-inspired clarity. 

- **Display & Headings:** Use tight line-heights and negative letter-spacing to create a "dense" and authoritative look for marketing and dashboard headers.
- **Body Text:** Standardized at 14px for density. In data-heavy views, 13px is preferred to maximize vertical information density.
- **Labels:** Uppercase or semi-bold labels with increased letter-spacing (`0.05em`) are used for metadata, status tags, and micro-copy.
- **Numerical Data:** For financial metrics, use the `currency-display` token which emphasizes bold weights to ensure values are the first thing a user sees.

## Layout & Spacing

ConstructPro utilizes a **Fixed Grid** philosophy for its primary desktop containers (max-width 1600px) to ensure consistent readability on ultra-wide monitors.

- **Grid:** A 12-column grid with a 20px gutter.
- **Rhythm:** Vertical spacing follows a 4px/8px baseline, but macro-sections are separated by 32px increments to maintain a breathable, organized flow.
- **Responsive Behavior:** 
    - **Desktop:** 1600px max container, 24px margins.
    - **Tablet:** Fluid width, 20px margins, stack 4-column grids into 2-columns.
    - **Mobile:** Fluid width, 16px margins, single-column stacks for all cards.

## Elevation & Depth

Visual hierarchy is established through a combination of **Glassmorphism** and **Soft Ambient Shadows**.

- **Level 0 (Background):** `#F1F5F9` (Flat).
- **Level 1 (Cards):** Pure white background with a very soft, diffused shadow (`0 4px 6px -1px rgba(0, 0, 0, 0.05)`). Used for standard dashboard modules.
- **Level 2 (Active/Overlays):** Stronger depth (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`) for modal dialogs or hero preview elements.
- **The Glass Layer:** The top navigation bar and floating headers use a `95%` opacity white fill with a `10px` backdrop blur and a `1px` border (`#E2E8F0`). This ensures the interface feels light and modern while staying readable over scrolling content.

## Shapes

The shape language is **Soft-Geometric**. Elements are generally square-ish to reflect the architectural nature of construction, but with softened corners to keep the software approachable.

- **Buttons & Small Inputs:** 8px (`0.5rem`) corner radius.
- **Cards & Sections:** 12px (`0.75rem`) corner radius.
- **Status Pills:** Fully rounded (`9999px`) to distinguish them from interactive buttons.
- **Logos & Icons:** 4px radius for a sharp, technical appearance.

## Components

### Buttons
- **Primary:** Solid `#004191` fill, white text, 8px radius. High-contrast hover state using `surface-tint`.
- **Ghost:** Transparent background with primary-colored text. Used for secondary actions (e.g., "Login").

### Cards
- Always use white backgrounds with the `shadow-level-1` and a `1px` border of `outline-variant`. 
- Content inside cards should follow the `24px` padding rule.

### Status Chips
- High-priority status indicators use a `1px` border and the risk-colored background at `10%` opacity to ensure text legibility while maintaining the color cue.

### Form Inputs
- Inputs use a `1px` border of `outline`. On focus, the border transitions to `primary` with a subtle glow. Label text is always `label-md`.

### Navigation Bar
- Height is fixed at `72px`. Use a backdrop-filter blur and a bottom border to separate it from the main content. Links use `body-base` with a `2px` underline for the active state.