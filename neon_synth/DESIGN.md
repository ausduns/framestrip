# Design System Strategy: Neon Precision & Tonal Depth

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Surgeon"**

This design system moves away from the generic "tech dashboard" aesthetic to embrace an editorial, high-end extractor experience. We are building a tool that feels like a precision instrument—surgical, focused, and undeniably premium. 

To break the "template" look, we utilize **intentional asymmetry**. Primary data points should not be centered; they should be anchored to the edges of containers, leaving generous, purposeful negative space. We lean into the "Extraction" metaphor: information isn't just displayed; it is "illuminated" against a deep, infinite void. The contrast between the charcoal abyss and the electric neon accents creates a sense of high-performance energy.

---

## 2. Colors & Surface Architecture
The palette is rooted in absolute depth, using `background (#0e0e0e)` as our canvas. The interaction model relies on the vibration between the dark base and the high-energy `primary (#8ff5ff)` and `secondary (#d674ff)` accents.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning or grouping content. In this system, boundaries are defined exclusively through tonal shifts. 
- To separate a sidebar from a main content area, place a `surface-container-low` section against the `surface` background. 
- Use the natural "void" of the background to create separation, never a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, stacked layers of smoked glass.
- **Base Level:** `surface` (#0e0e0e)
- **Secondary Level:** `surface-container-low` (#131313) for large layout blocks.
- **Tertiary Level:** `surface-container-high` (#201f1f) for interactive cards or nested modules.
- **Focus Level:** `surface-bright` (#2c2c2c) for elements currently being hovered or active.

### The "Glass & Gradient" Rule
To inject "soul" into the extractor, main CTAs and hero headers should utilize a **Signature Gradient** transitioning from `primary (#8ff5ff)` to `secondary (#d674ff)` at a 135-degree angle. Floating panels must use Glassmorphism: `surface-container-highest` at 60% opacity with a `20px` backdrop-blur.

---

## 3. Typography: The Editorial Scale
We employ a high-contrast typographic hierarchy to ensure the "Sleek/Modern" request is met with authority. While the user requested Montserrat, we have optimized this for an editorial feel using **Space Grotesk** for high-impact displays and **Manrope** for technical readability.

- **Display-LG (56px):** Used for "Hero" numbers or extraction counts. Tracking should be set to `-0.02em` to feel tight and engineered.
- **Headline-MD (28px):** Used for section titles. Always in Sentence case to maintain a sophisticated, non-aggressive tone.
- **Body-MD (14px):** Our workhorse. Use `on-surface-variant` (#adaaaa) for secondary descriptions to reduce visual noise.
- **Label-SM (11px):** All-caps with `+0.05em` letter spacing. Used for technical metadata and "Status" indicators.

---

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering**, not structural scaffolding.

- **The Layering Principle:** To create a "lifted" card, do not use a shadow. Instead, place a `surface-container-highest` card on top of a `surface-container-low` background. The subtle 3-4% shift in lightness provides a cleaner, more modern elevation than any shadow could.
- **Ambient Glows:** For "Floating" elements (like a floating action button or a modal), use a "Neon Shadow." Instead of black, the shadow is a highly diffused (40px blur) version of the `primary` or `secondary` color at 10% opacity. This mimics the light emission of a neon tube.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The Kinetic Trigger
- **Primary:** No border. Background is the `primary` to `secondary` signature gradient. Text is `on-primary` (Dark Teal). Use `radius-md` (0.375rem).
- **Secondary (Glass):** `surface-container-highest` background at 40% opacity with a `primary` ghost border (20% opacity).
- **States:** On hover, the `primary` color should "glow"—add a 15px outer blur of the same color.

### Input Fields: The Data Port
- **Background:** `surface-container-lowest` (pure black).
- **Indicator:** Instead of a full border, use a 2px bottom-bar of `outline-variant`. On focus, the bottom bar transitions to `primary` with a subtle outer glow.
- **Typography:** Placeholder text must be `on-surface-variant`.

### Extraction Cards
- **Rule:** Absolute prohibition of divider lines.
- **Structure:** Use `24px` of vertical white space to separate the "Header" from the "Data Grid." Use a subtle `surface-container-high` background to group related data points.

### Progress Bars & Scanners
- **Style:** A thin 4px track using `surface-container-highest`. The active "fill" should be a `primary` gradient. Add a "Scanning" light effect—a high-intensity white light that travels across the progress bar periodically.

---

## 6. Do's and Don'ts

### Do:
- **Do** use negative space as a functional element. Let the data breathe.
- **Do** use the `secondary (#d674ff)` color sparingly for "Success" or "Complete" states to create a distinct visual reward from the `primary` blue.
- **Do** utilize `radius-xl` for large parent containers and `radius-sm` for internal elements to create a "nested" visual language.

### Don't:
- **Don't** use pure white (#ffffff) for large blocks of body text; it causes "halogen halation" on dark backgrounds. Use `on-surface` (slightly off-white) or `on-surface-variant` for better legibility.
- **Don't** use standard "Drop Shadows." They look muddy on deep charcoal. Only use "Ambient Glows" or "Tonal Shifts."
- **Don't** use 100% opaque borders. They create a "boxed-in" feel that contradicts the sleek, futuristic North Star.