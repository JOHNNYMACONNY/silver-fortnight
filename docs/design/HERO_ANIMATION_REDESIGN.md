# Hero Animation Redesign – TradeYa Network

## Objective
Create a slick, modern, and professional hero animation that visually represents the TradeYa "network of skills" without using emojis or cartoonish elements. The design should feel premium, tech-forward, and aligned with the glassmorphic aesthetic.

## Visual Concept: "The Living Network"
Instead of a literal chameleon or floating tiles, we will visualize the *TradeYa Network* itself—a dynamic, interconnected constellation of skills and users.

### 1. The Core: 3D Glass Polyhedron
- **Shape:** A slowly rotating, translucent icosahedron (20-sided shape) or sphere made of glass panels.
- **Material:** Frosted glass with subtle refraction and edge highlights (using CSS 3D transforms or a lightweight SVG simulation).
- **Inner Light:** A soft, breathing glow in the center (TradeYa orange) that illuminates the glass faces from within.

### 2. The Network: Constellation of Skills
- **Nodes:** Small, polished glass dots or tiny "tokens" floating in 3D space around the core.
- **Icons:** Use `lucide-react` icons (e.g., `Code`, `PenTool`, `Camera`, `Music`, `Briefcase`) embedded within these tokens. No emojis.
- **Connections:** Thin, glowing lines that dynamically form and dissolve between nodes, representing active trades.
- **Motion:** A slow, mesmerizing orbital drift. Not chaotic; think "planetary system" or "neural network."

### 3. Interaction & Depth
- **Parallax:** Mouse movement subtly shifts the perspective of the network, creating a sense of depth.
- **Hover:** Hovering over the animation area might pause the rotation or highlight nearest connections.
- **Spotlights:** Occasionally, a specific skill node pulses brighter and a small label (e.g., "Design", "Development") fades in near it, then fades out.

## Implementation Strategy (React + Framer Motion)
We will use `framer-motion` for high-performance, declarative animations. We don't strictly need Three.js for this level of complexity; CSS 3D transforms and SVG lines are lighter and sharper for UI elements.

### Component Structure
1.  `HeroNetwork`: Main container, handles mouse parallax state.
2.  `GlassCore`: The central 3D object (simulated with rotating CSS planes or a layered SVG).
3.  `SkillOrbit`: A container for a specific orbital ring (we can have 2-3 rings at different angles).
4.  `SkillNode`: Individual item with Lucide icon, glass background, and hover effects.
5.  `ConnectionLines`: An SVG overlay that draws lines between active nodes.

## Assets & Colors
-   **Icons:** `lucide-react` (already in project).
-   **Colors:**
    *   Primary Glow: `primary-500` (Orange)
    *   Secondary Accents: `secondary-500` (Blue), `pink-500` (Magenta) for variety.
    *   Glass: `white/10` to `white/5` with `backdrop-blur`.
-   **Atmosphere:** A faint, moving gradient mesh in the background (reusing `GradientMeshBackground` logic if possible) to tie it to the rest of the site.

## Why this is better:
-   **Professional:** Removes "emoji" feel completely.
-   **Abstract but Clear:** Represents "connection" and "skills" without being literal.
-   **Modern:** Fits the "Glass Morphic Premium" style perfectly.
-   **Scalable:** Easy to add more skill icons later.

