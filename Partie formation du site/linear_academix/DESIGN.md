```markdown
# Design System Document: High-End Editorial E-Learning

## 1. Overview & Creative North Star: "The Architectural Grid"
This design system moves away from the "friendly, rounded" clichés of modern EdTech. Instead, it adopts **The Architectural Grid**—a creative north star that treats the digital interface like a premium printed monograph or a high-end architectural portfolio.

The vibe is **Sharp, Minimalist, and Precise**. We achieve a high-end feel not through "fluff," but through extreme intentionality in white space, a rejection of decorative lines, and a reliance on brutalist geometry. By utilizing a pure white canvas (#FFFFFF) contrasted with a vibrant, high-energy green (#22C55E), we create an environment that feels oxygenated and intellectually stimulating.

### The Signature Look
*   **Asymmetric Breathing Room:** Large, intentional gaps in the layout to guide the eye.
*   **Total Sharpness:** Media (images/video) must have a 0px radius. No exceptions.
*   **Tonal Definition:** We define space through color blocks, not lines.

---

## 2. Colors: Precision & Energy

This system uses a "High-Contrast Laboratory" palette. The background is sterile and focused, while the green accent acts as a "laser pointer" for the user's attention.

### Core Palette (Material Design Tokens)
*   **Background (`#f9f9f9` / `#ffffff`):** Use `#ffffff` (Surface Container Lowest) for the main workspace to ensure maximum "air."
*   **Primary (`#006e2f`):** The authoritative green for text-based actions and deep branding.
*   **Primary Container (`#22c55e`):** The signature vibrant green. Use this for high-impact CTAs.
*   **Surface Tiers:** 
    *   `Surface`: `#f9f9f9` (The "Base" layer)
    *   `Surface Container Low`: `#f3f3f4` (Secondary sections)
    *   `Surface Container High`: `#e8e8e8` (Interactive elements)

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. To separate a lesson module from a sidebar, use a transition from `Surface` (#f9f9f9) to `Surface Container Lowest` (#ffffff).

### Signature Textures & Glassmorphism
*   **The "Vibrant Shift":** For Hero CTAs, use a subtle linear gradient from `Primary` (#006e2f) to `Primary Container` (#22c55e) at a 135-degree angle. This adds a "lithographic" depth.
*   **Floating Navigation:** Use `Surface Container Lowest` (#ffffff) with a 70% opacity and a 20px `backdrop-blur`. This allows the vibrant green of the content to bleed through as the user scrolls, creating a premium "frosted glass" feel.

---

## 3. Typography: The Grotesk Voice

We utilize **Plus Jakarta Sans**, a modern Grotesk that balances geometric purity with high legibility. 

### Typography Scale
*   **Display Large (3.5rem):** Reserved for course titles or major landing headings. Tracking: -0.02em.
*   **Headline Medium (1.75rem):** Use for module titles. Bold weight.
*   **Title Medium (1.125rem):** The "Workhorse." Use for card headings and section titles.
*   **Body Large (1rem):** Standard reading text. Line height must be generous (1.6) to maintain the "Airy" vibe.
*   **Label Medium (0.75rem):** All-caps with +0.05em letter spacing for metadata (e.g., "DURATION," "LEVEL").

**Editorial Hierarchy:** Always pair a `Display` heading with a `Label` tag above it in `Primary` (#006e2f). This creates an "Academic Journal" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too "soft" for this system. We convey depth through the **Layering Principle**.

*   **Stacking:** Place a `Surface Container Lowest` (#ffffff) card (4px radius) on a `Surface` (#f9f9f9) background. The subtle 1.5% shift in gray provides all the separation required.
*   **Ambient Shadows:** If a card must float (e.g., a modal), use a shadow: `0px 20px 40px rgba(26, 28, 28, 0.04)`. It should be nearly invisible—a "whisper" of a shadow.
*   **The Ghost Border:** If accessibility requires a border, use `Outline Variant` (#bccbb9) at **15% opacity**. 

---

## 5. Components

### Media (Images/Video)
*   **Radius:** Always 0px.
*   **Styling:** Use a 4px left-side accent bar in `Primary Container` (#22c55e) for featured thumbnails to tie them into the system.

### Buttons
*   **Primary:** `Primary Container` (#22c55e) background, `On Primary Container` (#004b1e) text. Radius: 4px.
*   **Secondary:** `Surface Container High` (#e8e8e8) background. No border. Radius: 4px.
*   **Tertiary:** Ghost style. Text only in `Primary`. On hover, add a `Surface Container Low` background.

### Cards & Lists
*   **Constraint:** Zero dividers. Use 32px or 48px of vertical white space to separate list items.
*   **Interaction:** On hover, a card should transition its background color from `Surface` to `Surface Container Lowest` and shift 2px to the right—never up.

### Progress Bars (Unique to e-learning)
*   **Style:** A 2px thin line. The track is `Surface Container High`, and the indicator is `Primary Container` (#22c55e). No rounded caps; the ends must be perfectly square.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace the Edge:** Let images run full-bleed to the edge of containers.
*   **Use Mono-spacing:** Use a monospaced font variant for "Time Spent" or "Grade" numbers to enhance the "Professional/Scientific" feel.
*   **White Space as a Tool:** If a layout feels "cheap," double the padding between elements.

### Don’t:
*   **No Rounding Media:** Never round the corners of a video player or image. It breaks the "Architectural" rule.
*   **No Heavy Shadows:** If the shadow is clearly visible, it’s too dark.
*   **No Center Alignment:** Lean into left-aligned editorial layouts. Center alignment is for templates; asymmetry is for design.
*   **No Icons in Circles:** If using icons, place them in square or 4px-rounded containers only. Never use circles.