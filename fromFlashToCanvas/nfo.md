# Orbiting Sprites — From Flash to Canvas

This experiment recreates a classic “orbiting particles” feel using HTML5 Canvas, translating the kind of motion and interactivity many of us prototyped in Flash.

What you can do
- Hover: sprite under the pointer swells smoothly for visual feedback.
- Click: reverses the clicked sprite’s orbit direction and spawns a new neighbor.
- Watch: subtle trails and starfield background create depth and motion.

Under the hood
- Dual‑canvas approach: one canvas for the static starfield (bg), one for sprites (with trails), and a HUD overlay for lightweight text.
- DPR aware rendering: canvases size themselves to devicePixelRatio for crisp output.
- Motion model: each sprite keeps radius `r`, `angle`, `speed`, `size`, `color`, and a `scale` that eases toward a target on hover.
- Trails: a translucent fill on the sprite canvas simulates motion persistence.

Changes in this build
- Black background applied directly to the background canvas each frame.
- Sprites scaled globally by +50%.
- Info (this file) available in‑app via an “i” button (top‑right).

Notes
- Press the “i” button to toggle this info overlay.
- Press Escape or click outside the card to close.

