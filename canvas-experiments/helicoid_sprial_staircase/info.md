# Helicoid Spiral Staircase — Redefine Style

This sketch renders a neon helicoid staircase with orbit controls. Use the eye icon in the upper right to show or hide the control panel. Camera sliders adjust yaw, pitch, and distance directly, while range inputs alter staircase geometry, glow, and coloration. Presets can be shuffled, saved to a JSON file, or imported later.

## Controls
- **Eye Toggle**: Show/hide the left control drawer to focus on the canvas.
- **Geometry**: Steps, radius, tread depth, rise, span, thickness.
- **Dynamics**: Turns, auto-rotation speed, global tilt.
- **Styling**: Glow, line width, hue, and optional features (handrail, ribbon, solid treads).
- **Camera**: Yaw °, pitch °, and distance sliders mirror drag and wheel gestures.
- **Presets**: Shuffle for quick variations, save to JSON, or import saved presets.
- **Preset Select**: Use the dropdown to switch between Default, Aurora, Ember, or Zenith looks; “Custom / Manual” indicates tweaks from the base setups.

## ChatGPT Generation Prompt

Use the following script with ChatGPT (or similar) to recreate or extend this experience. Paste it into a new conversation and supply any desired tweaks where noted.

```text
You are a creative front-end assistant. Build a self-contained HTML canvas demo called “Helicoid Spiral Staircase — Redefine Style”.

Requirements:
1. Fullscreen responsive canvas with dark neon aesthetic.
2. Render a helicoid/spiral staircase constructed from parametric geometry; include handrail and optional ribbon overlay.
3. Provide a blurred glass-morphism control panel (RedefineIt vibe) with sliders for:
   - steps (20–400)
   - radius (40–300)
   - tread depth (8–120)
   - rise per step (2–18)
   - span degrees (6–40)
   - thickness, turns, auto-rotation, tilt (degrees), glow, line width, hue
   - toggles for handrail, ribbon, solid tread fill
4. Add camera controls (yaw°, pitch°, distance) that stay in sync with pointer orbit + wheel zoom.
5. Animate gentle auto-rotation; allow drag to orbit, wheel to zoom, double-click reset.
6. Style control buttons as neon pills; include shuffle preset plus “Save Preset” (download JSON) and “Import JSON” (file picker that applies state).
7. Place an eye icon in the top-right to show/hide the control panel; update ARIA states.
8. Glow treatment: use stroke neon glow with adjustable blur.
9. Keep everything in vanilla JS (no external libs) and comment tricky math sections sparingly.

Return a single HTML file with inline CSS/JS.
```

## Notes
- Preset files are plain JSON. Fields store radians for angular values (`span`, `tilt`, camera angles); the importer accepts optional degree fields (`spanDeg`, `tiltDeg`) as well.
- Saved filenames include a timestamp so repeated exports remain distinct.
