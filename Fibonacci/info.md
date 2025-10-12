# Fibonacci Spiral Section (JavaScript Module)

A drop-in ES module that renders a beautiful, self-contained section explaining the **Fibonacci Spiral** — complete with a styled paragraph, formula, and an optional procedurally drawn SVG spiral.

---

## 📦 Installation

Save the file as:

```bash
fibonacci-spiral-section.module.js
```

---

## 🧩 Usage

Place a mount element in your HTML:

```html
<section id="fib-mount"></section>
```

Then import and render the module:

```html
<script type="module">
  import { renderFibonacciSection } from './fibonacci-spiral-section.module.js'

  // Minimal example
  renderFibonacciSection('#fib-mount')

  // Customizable example
  renderFibonacciSection('#fib-mount', {
    theme: 'dark', // 'dark' | 'light'
    accent: '#5eead4', // accent color
    showGraphic: true, // toggle the SVG spiral
    density: 1100, // spiral smoothness (420–2000)
    maxTheta: Math.PI * 5, // spiral turns (≈3.2π–8π)
    headingLevel: 2 // heading tag level (h2–h6)
  })
</script>
```

---

## 🎨 Features

- Isolated **Shadow DOM** styling (no conflicts)
- Accessible content with ARIA roles and labels
- Built-in **Fibonacci spiral SVG generator**
- Configurable **theme, accent color, and detail density**
- Lightweight (pure JavaScript, no dependencies)

---

## 🧮 Mathematical Basis

The logarithmic spiral used in this module is based on the Fibonacci sequence and golden ratio (φ ≈ 1.618):

```text
r(θ) = a · e^{bθ}
where b = ln(φ) / (π/2)
```

This produces the same growth ratio seen in natural phenomena such as **nautilus shells**, **sunflower seeds**, and **spiral galaxies**.

---

## 🪄 Example Output

When rendered, the module produces a section like this:

> **Fibonacci Spiral (φ ≈ 1.618)**  
> A self-contained card with an explanation, inline formula, and optional SVG visualization. The component can be dropped into any webpage with no additional styling required.

---

## 🧱 Optional Extensions

Would you like to extend this into a reusable **Web Component** (`<fibonacci-spiral>` tag) or a **React wrapper**? Both can be layered directly on top of this module.
