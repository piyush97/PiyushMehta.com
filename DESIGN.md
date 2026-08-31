---
name: PiyushMehta.com
description: Evidence-led portfolio and technical journal for durable product systems.
colors:
  ink-night: "#171a2f"
  ink-deep: "#0f1221"
  surface-night: "#222640"
  paper-warm: "#f6f3ea"
  paper-surface: "#fffaf0"
  text-bright: "#f6f7ff"
  text-ink: "#121827"
  text-secondary: "#b4bad8"
  text-muted: "#8f96ba"
  border-night: "#343a5f"
  border-paper: "#ddd3c2"
  amber-signal: "#ffcc68"
  rust-signal: "#8d3d1f"
  success: "#a8e6b8"
  danger: "#ff5252"
typography:
  display:
    fontFamily: "Muli, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(3rem, 5vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "normal"
  headline:
    fontFamily: "Muli, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 1.05
  title:
    fontFamily: "Muli, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Muli, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Muli, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "clamp(4rem, 8vw, 7rem)"
components:
  button-primary:
    backgroundColor: "var(--color-accent)"
    textColor: "var(--color-accent-foreground)"
    rounded: "{rounded.sm}"
    padding: "0.625rem 1rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "var(--color-text-primary)"
    rounded: "{rounded.sm}"
    padding: "0.625rem 1rem"
  input:
    backgroundColor: "var(--color-bg)"
    textColor: "var(--color-text-primary)"
    rounded: "{rounded.sm}"
    padding: "0.625rem 0.75rem"
  card:
    backgroundColor: "var(--color-surface-raised)"
    textColor: "var(--color-text-primary)"
    rounded: "{rounded.lg}"
    padding: "1.4rem"
---

# Design System: PiyushMehta.com

## Overview

**Creative North Star: "The Evidence Ledger"**

PiyushMehta.com is a public engineering record, not a generic personal brand template. The visual system treats every page as a legible ledger of decisions: cool ink surfaces hold the work, warm amber marks the signal, and typography carries the authority. The result is technical and editorial without pretending to be a dashboard. It should feel useful to an engineering leader evaluating judgment, a reader staying with a difficult idea, or a collaborator looking for proof.

The incumbent world is compact at the navigation level and spacious at section boundaries. It uses a dark-first palette with a warm paper/light theme, semantic tokens shared across both, and small tonal shifts rather than decorative noise. Motion is brief and state-oriented: opacity and transforms reveal content, controls respond with restrained translation, and reduced motion preserves hierarchy without blocking access. The authored direction generally avoids gradient text, emoji-led visual language, thick colored side rails, and bounce-heavy feedback, but the incumbent still has scoped exceptions: ArticleMeta and blog explainers retain Unicode/emoji glyphs, PostReactions uses a 1.28× reaction-pop overshoot, TechComparison uses a 1.05× selected-control scale, and body/legacy card/newsletter surfaces retain background gradients. Treat these as content- or component-specific legacy treatments, not defaults for new UI.

**Key Characteristics:**
- Evidence-first editorial hierarchy
- Cool ink surfaces with a rare amber signal
- Muli for voice; Source Code Pro for code and measured data
- Tonal layering and thin borders before heavy shadows
- Route-scoped responsive grids: homepage at 920px/620px, writing at 860px/640px, and about/contact at 960px/640px

## Colors

The palette is a high-contrast ink-and-signal system: deep blue-violet surfaces establish focus, while amber (or rust in the light theme) identifies action, emphasis, and navigation state.

### Primary
- **Amber Signal** (#ffcc68): Primary dark-theme accent for actions, active navigation, metrics, links, and evidence markers.
- **Rust Signal** (#8d3d1f): Light-theme counterpart to Amber Signal; retains emphasis without relying on low-contrast gold on warm paper.

### Neutral
- **Ink Night** (#171a2f): Dark-theme page background.
- **Ink Deep** (#0f1221): Deepest surface for contrast and overlays.
- **Surface Night** (#222640): Raised dark surface for cards, forms, and grouped content.
- **Warm Paper** (#f6f3ea): Light-theme page background.
- **Paper Surface** (#fffaf0): Light-theme raised surface.
- **Bright Text** (#f6f7ff): Primary dark-theme text and headings.
- **Ink Text** (#121827): Primary light-theme text and headings.
- **Secondary Text** (#b4bad8): Dark-theme supporting copy.
- **Muted Text** (#8f96ba): Metadata, captions, and low-emphasis labels.
- **Night Border** (#343a5f): Dark-theme dividers and component edges.
- **Paper Border** (#ddd3c2): Light-theme dividers and component edges.

### Named Rules

**The Ledger Rule.** Use the accent to mark decisions and actions, not to decorate every surface. Let neutral hierarchy do most of the speaking.

**The Two-Ink Rule.** Dark and light themes share semantic roles, but each theme chooses its own readable ink, surface, border, and signal values. Never paste dark-theme values into the light theme.

## Typography

**Display Font:** Muli (with system sans fallbacks)

**Body Font:** Muli (with system sans fallbacks)

**Label/Mono Font:** Source Code Pro, Fira Code, Fira Mono, Roboto Mono, and platform monospace fallbacks

**Character:** Muli keeps the voice direct, rounded, and human without becoming playful. Source Code Pro is reserved for code, dates, measurements, and technical artifacts; it is not a costume for ordinary prose.

### Hierarchy
- **Display** (800, `clamp(3rem, 5vw, 5rem)`, 0.98): Homepage hero statements and high-authority first-viewport claims.
- **Headline** (800, `3.75rem`, 1.05): Major section headings and editorial entry points.
- **Title** (800, `1.35rem`, 1.2): Case-study, notebook, card, and supporting content titles.
- **Body** (400, `1rem`, 1.625): Reading copy, descriptions, and explanatory content. Keep prose measures comfortable rather than stretching text across the viewport.
- **Label** (800, `0.8rem`, 1.2, `0.12em`, uppercase): Eyebrows, metadata labels, and compact navigation context.

### Named Rules

**The Weight Before Color Rule.** Establish hierarchy with size, weight, and spacing first; use the accent for a precise semantic distinction.

**The Code Means Code Rule.** Use the monospace face for source, commands, dates, metrics, and other measured artifacts only.

## Layout

The primary content container is 784px for reading-focused surfaces and 1200px for broad portfolio layouts; the active portfolio shell uses a fluid width capped at 1120px with 1rem side padding. The homepage uses a two-column hero (1.08fr / 0.92fr) with a minimum 320px media column, a four-column metric band, and a three-column case-study grid. About and contact share the same 1120px shell and two-column hero; writing uses the same shell with a narrower two-column hero and a three-column featured grid. Spacing is route-specific rather than one universal token: homepage section blocks use clamp(4.5rem, 9vw, 7rem), about sections use clamp(3rem, 7vw, 5rem), contact sections use clamp(2.5rem, 6vw, 4.5rem), and writing sections use clamp(2.5rem, 6vw, 5rem).

The homepage changes at 920px: its hero becomes one column, metrics and case studies become two columns, and the notebook becomes one column; at 620px, metrics and case studies become one column and display type contracts to approximately 3rem. Writing changes at 860px, collapsing its hero and featured grid, then at 640px contracts the shell side padding, newsletter to one column, and hero type. About and contact change at 960px, collapsing their hero and secondary grids; about metrics become one column at 640px. Independently, the navigation switches to its mobile panel at 767px (the CSS hides desktop links at that width); mobile links use full-width rows, a fixed overlay, focus restoration, and a scrollable panel capped by the viewport.

## Elevation & Depth

The system uses tonal layering with restrained elevation. Raised surfaces change background and border before reaching for a shadow. The core shadows are 0 2px 6px 0 rgba(0, 0, 0, 0.1) for quiet surfaces and 5px 5px 15px rgba(0, 0, 0, 0.12) for legacy card emphasis. The homepage portrait actively uses a deliberate ambient hero shadow (0 24px 80px rgba(0, 0, 0, 0.22)); that is an authored focal treatment, not a default card elevation. The homepage east accent also carries a smaller accent-colored shadow. Writing-hero guidance uses a scoped shadow, and hover states may use a larger soft shadow, but rest states should remain calm. Backdrop blur is functional on the sticky navigation and is also used by the content-specific PostReactions controls; do not generalize either treatment to every surface.

### Shadow Vocabulary
- **Soft surface** (`0 2px 6px 0 rgba(0, 0, 0, 0.1)`): Newsletter cards and low-elevation grouped controls.
- **Card emphasis** (`5px 5px 15px rgba(0, 0, 0, 0.12)`): Legacy card treatment where an existing card needs clear separation.
- **Interactive hover** (`0 16px 40px rgba(0, 0, 0, 0.18)`): Elevated hover feedback for writing-list items; never use as a permanent halo.

### Named Rules

**The Quiet Rest Rule.** A surface should be visually calm before interaction. Depth appears through tonal separation, borders, and purposeful hover/focus state.

## Shapes

The shape language is compact and practical: 6px controls, 8px grouped content, 12px prominent cards, and 16px newsletter/form shells. Borders are generally 1px and token-colored. Rounded corners group related content without turning every element into a pill; pill geometry is reserved for tags, compact metadata, and status-like controls. Focus uses a visible 2px outline with a small offset. Avoid thick colored left or right rails on cards, callouts, and alerts.

## Components

### Buttons
- **Shape:** 6px radius; minimum control height is approximately 44px where the element is a primary touch target.
- **Primary:** Amber Signal background with Ink Night text in the dark theme; Rust Signal with Warm Paper text in the light theme. Use compact horizontal padding and strong weight.
- **Hover / Focus:** Darken or shift the background modestly; use a visible 2px accent outline on focus. Transitions are short and ease-out; no bounce.
- **Secondary / Ghost:** Transparent or tonal surface with token-colored text and a 1px border. Keep the same control height and focus treatment as primary actions.

### Chips
- **Style:** Accent-tinted background, accent text, 1px accent border, and compact rounded geometry. Use for tags, metadata, and code-adjacent inline context.
- **State:** Selected or active chips use stronger accent contrast; unselected chips remain quiet. Chips are labels or filters, not substitutes for primary navigation.

### Cards / Containers
- **Corner Style:** 8–12px depending on surface prominence; 16px for newsletter shells.
- **Background:** Dark theme uses Surface Night over Ink Night; light theme uses Paper Surface over Warm Paper.
- **Shadow Strategy:** Prefer tonal layering and a thin border. Add Soft surface or Interactive hover shadows only where separation or state requires it.
- **Border:** 1px semantic border. Use a full outline for callouts and risk states rather than a thick colored side stripe.
- **Internal Padding:** 1rem for compact controls, 1.4–1.5rem for cards, and up to 2rem for broad feature panels.

### Inputs / Fields
- **Style:** 1px card border, page-background fill, 6px radius, inherited Muli typography, and at least 44px minimum height.
- **Focus:** Accent border plus a visible 2px accent outline with a 1–2px offset.
- **Error / Disabled:** Errors use the semantic danger color with a clear recovery message. Disabled controls reduce opacity, retain the not-allowed cursor, and do not become the only indication of state.

### Navigation
- **Style:** Sticky, centered shell with a brand mark, text links, theme action, and mobile menu control. The brand uses the PM mark plus Piyush Mehta in bright text.
- **Default / Hover / Active:** Secondary text at rest; accent text and a subtle accent-tinted surface for hover and current-page state. Keep transforms to a small upward nudge.
- **Mobile:** Hide desktop links below 767px; expose the labeled hamburger, fixed overlay, and scrollable panel. Opening the panel must trap focus, close on Escape or overlay click, and restore focus to the toggle.

The blog index uses readable article rows with metadata, title, description, tags, and a clear read action. Its featured writing cards and BlogFilter writing list are reading surfaces first: use open spacing, strong heading contrast, compact tag/chip labels, and a small hover lift rather than a dense dashboard grid.

### Evidence Blocks
Metric bands, case-study panels, risk matrices, and interactive explainers are signature evidence components. They may use color to encode status or compare values, but the encoded meaning must also be present in text, labels, or state attributes.

## Do's and Don'ts

### Do:
- **Do** make the evidence, constraint, tradeoff, or outcome the visual focal point.
- **Do** use semantic theme tokens from `src/styles/global.css` instead of introducing one-off palette values.
- **Do** preserve the dark ink / warm paper theme pairing and its readable text roles.
- **Do** use Muli for interface and prose, and monospace only for code, data, dates, or measurements.
- **Do** keep focus states visible, touch targets comfortable, and mobile panels keyboard-operable.
- **Do** use authored SVG icons with consistent stroke weight when an interface icon is needed.
- **Do** prefer 1px full borders, tonal surfaces, and restrained shadows over decorative side rails.

### Don't:
- **Don't** invent testimonials, clients, metrics, credentials, or outcomes to fill visual space.
- **Don't** use gradient text as decoration. Background gradients remain in the body wash, legacy cards, newsletter shell, reaction sheen, and some content surfaces; they are scoped exceptions, not a general component recipe.
- **Don't** make emoji or Unicode glyphs the default icon system. ArticleMeta share actions and blog explainers retain legacy/content-specific glyphs (including quiz feedback and TechComparison logos); new interface icons should use authored SVG.
- **Don't** use interaction overshoot as a general feedback pattern. PostReactions' 1.28× icon pop and TechComparison's 1.05× selected scale are incumbent exceptions; ordinary controls should use restrained translation or color change.
- **Don't** animate width, height, or other layout properties when a transform can express the same state.
- **Don't** use bounce or spring motion for ordinary navigation, feedback, or reveal states.
- **Don't** use thick colored `border-left` or `border-right` treatments on cards, callouts, list items, or alerts.
- **Don't** make the accent omnipresent. Its rarity is what makes an active state legible.
