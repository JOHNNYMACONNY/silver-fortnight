### Profile Header 3D Overlay

Status: Experimental (behind overlay component)

Purpose: Add subtle three.js/WebGL visual effects over uploaded banner images while preserving readability and brand.

Key files
- `src/components/ui/ProfileBanner.tsx`: mounts the overlay layer.
- `src/components/background/ThreeHeaderOverlay.tsx`: transparent overlay wrapper using `DynamicBackground` (WebGL shader).
- `src/components/background/DynamicBackground.tsx` → `WebGLCanvas.tsx`: shader-driven background; respects `prefers-reduced-motion`.

Presets (brand-aligned)
- `ribbons`: curl-noise ribbon aesthetic.
- `audioRibbons`: audio-reactive variant (future parameterization).
- `linework`: flow-field linework (future variant).

Blend modes and intensity
- Default: `mix-blend-mode: screen`, `opacity: 0.1`.
- Consider `soft-light`, `overlay`, or `plus-lighter` for different imagery.

Accessibility and performance
- Overlay is `pointer-events: none` and paused by system `prefers-reduced-motion` via `DynamicBackground` fallback.
- Future: luminance sampling to auto-tune opacity or switch underlay on high-noise photos.

How to use
- `ProfileBanner` automatically renders the overlay. Tune by editing the `ThreeHeaderOverlay` props in `ProfileBanner.tsx`.

Next steps
- Add UI controls in `BannerSelector` to toggle overlay, choose preset, adjust intensity, and select blend mode.
- Parameterize `WebGLCanvas` to vary speed/complexity per preset.



