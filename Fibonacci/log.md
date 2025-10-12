# Fibonacci Shell — Features and Math

This document explains the controls, features, and mathematics used by the Fibonacci Shell visualizer in `Fibonacci/index.html`.

## Overview

The renderer draws a logarithmic spiral “shell” with adjustable thickness, color, perspective, rings, and animated evolution. Chambers (annular spiral bands) can be overlaid, along with spiral dividers and spiral hatching to emphasize the spiral structure. Presets can be loaded from a JSON file and applied via a dropdown.

## Quick Start

- Show/hide options: top‑right eye button.
- Toggle info: top‑right info button (loads this file).
- Choose a preset: Preset dropdown. JSON presets from `Fibonacci/presets.json` are added automatically.
- Export/Import settings JSON: buttons in the panel; import by pasting JSON.
- Export PNG: click Export PNG.

## Controls

- Geometry
  - `Turns`: Total spiral turns. Also animates if Evolve > 0.
  - `Growth / Turn`: Growth factor per 360°; ≈1.618 produces “golden” shells.
  - `Base Radius`: Radius at t=0.
  - `Thickness (%)`: Fractional shell thickness from inner to outer spiral.
  - `Rotation (°)`: Rotates the shell in the plane.
  - `Samples / Turn`: Curve sampling for precision.
  - `Shells`: Number of shells to draw (multi‑shell).
  - `Shell Offset (°)`: Extra rotation per additional shell.
  - `Shell Scale (%)`: Scale factor applied per additional shell.
  - `Hue Shift / Shell`: Hue offset added per shell.
  - `Center X/Y (%)`: Center as canvas percent.
- Appearance
  - `Outline (px)`, `Outline Color`.
  - `Fill Alpha (%)`: Shell fill alpha via radial gradient across hue shift.
  - `Base Hue`, `Hue Delta`, `Saturation`, `Lightness`.
  - `Transparent BG`, `BG Color`.
- Rings
  - `Rings`: Toggle. Concentric rings spaced at equal angle increments along the spiral.
  - `Ring Count`, `Ring Alpha (%)`.
- Perspective
  - `Perspective`: Toggle and `Foreshortening` amount.
- Animation
  - `Spin`: Toggle and speed (°/s).
  - `Evolve`: Increase/decrease turns per second.
- Chambers
  - `Chambers`: Toggle.
  - `Chamber Steps`: Number of chamber bands across total turns.
  - `Chamber Line Width`: Strokes chamber boundaries; 0 disables.
  - `Label Fibonacci`: Draws Fibonacci numbers along chamber centers.
  - `Spiral Dividers`: Draws M inner spiral ribs in each chamber.
  - `Spiral Hatching`: Draws H faint inner spiral lines in each chamber.
- Presets and JSON
  - Preset dropdown includes built‑ins and any found in `presets.json`.
  - Export JSON copies current UI to clipboard (prompt fallback).
  - Import JSON prompts for a JSON blob and applies it.

## Math Background

- Logarithmic spiral
  - Polar form: r(t) = a·e^(b·t), where t is radians.
  - Growth per turn: G = e^(b·2π). Therefore b = ln(G) / (2π).
  - For the golden spiral feel, set G ≈ φ ≈ 1.618.

- Thickness and inner spiral
  - The outer spiral uses radius r(t) = baseR·e^(b·t).
  - The inner spiral uses r_i(t) = r(t)·(1 − thickPct), where thickPct ∈ [0,1].
  - The shell is the region between inner and outer curves.

- Sampling and polygon fill
  - We sample S points along t ∈ [0, T] where T = turns·2π.
  - Build two polylines: outer[0..S], inner[0..S]. The shell polygon is
    outer(0→S) + inner(S→0) closed, then filled and optionally stroked.

- Rings along the spiral
  - For j = 1..ringCount, pick angle t_j = (j/ringCount)·T.
  - Draw a circle with radius r(t_j) around the center (after perspective projection), approximated by short segments.

- Perspective projection
  - A lightweight non‑linear projection emphasizing depth toward a vanishing line:
    - Let A = (ax, ay) be the anchor near the bottom of the canvas.
    - Depth d = clamp((ay − y)/H, 0, 1) with H ≈ canvas height.
    - Scale f = 1/(1 + k·2·d), k ∈ [0,1] is `Foreshortening`.
    - Projected point P(x,y) → A + (P − A)·f.

- Rotation
  - Apply an in‑plane rotation by `rot` to angle: t' = t + rot.
  - Optional `Spin` animates rot(t) over time.

- Evolve
  - If `Evolve` > 0, the effective turns increases over time: turns_curr += rate·dt.

## Chambers

- Partitioning
  - With `N = Chamber Steps`, partition t into N equal segments: [t_k, t_{k+1}], k=0..N−1,
    where t_k = (k/N)·T and T = turns·2π.

- Chamber polygon
  - For each chamber segment, sample S_c points between t_k..t_{k+1} on both outer and inner spirals, then build a closed polygon and fill it.
  - Fill color uses a hue ramp: h = h0 + hD·(k/N) with alpha from `Fill Alpha`.

- Labels
  - Center angle t_m = (t_k + t_{k+1})/2.
  - Label radius r_m = baseR·e^(b·t_m)·(1 − 0.5·thickPct).
  - The k‑th Fibonacci number can be displayed (or fallback to k+1).

- Spiral dividers (new)
  - Draw M inner spiral curves within each chamber to emphasize the spiral flow.
  - Modes:
    - Even: f_m = m/(M+1), linear across thickness.
    - Golden Ratio: geometric spacing with r = 1/φ; f_m = (1 − r^m)/(1 − r^{M+1}).
    - Polar (log-uniform): equal spacing in log radius; s_m = exp(ln(1−thick) + u·(0→1)), map to f.
    - Archimedean: r(t) = a + c(t−t0) matching the same thickness fraction at t0 and t1.
  - For even/golden/polar: scale s = (1 − thickPct) + thickPct·f, and draw r_m(t) = baseR·s·e^(b·t), t ∈ [t_k, t_{k+1}].

- Spiral hatching (new)
  - Similar to dividers, but with more numerous, faint strokes (H lines) to texture the chamber.
  - Uses the same r_m(t) family with lower alpha and thinner width.

- Divider arcs (visual aid)
  - Optional short circular arcs at each chamber’s mid-angle drawn at the divider radii.
  - Arc span is configurable (degrees), with additional shaping:
    - Arc Bend: warps radius across the arc (bulge inward/outward).
    - Arc End Offset: pushes start/end radii in opposite directions.
  - Makes the chosen divider mode immediately visible and expressive.

## Performance Notes

- Sampling density scales with `Samples / Turn`; raise it for crisper edges at a cost.
- Dividers/hatching add strokes proportional to `Chamber Steps` × (M or H); moderate values recommended for mobile.
- A trim, single‑pass 2D canvas pipeline is used; perspective is applied per vertex.

## Presets and JSON

- Built‑in presets appear in the dropdown.
- `Fibonacci/presets.json` can define additional presets in any of these shapes:
  - { "presets": [ { "name": "MyPreset", "settings": { … } } ] }
  - [ { "name": "MyPreset", "settings": { … } } ]
  - { "MyPreset": { … }, "Another": { … } }
- An optional `Fibonacci/preset.js` can provide a global `window.FIB_USER_PRESET` object which is added as “User Preset”.

## Coordinate System Summary

- Canvas pixel space with device‑pixel‑ratio scaling.
- Center point (cx, cy) is in pixels derived from `%` inputs.
- Spiral defined in polar (r, t), mapped to Cartesian, rotated, optionally projected, then rasterized.

## Ideas for Extension

- Adaptive sampling: allocate more segments where curvature is higher.
- Shaded relief: derive tangents and apply light/shadow along the shell.
- WASM core for higher‑res output.
- SVG export of outlines and chamber polygons.

— End —
