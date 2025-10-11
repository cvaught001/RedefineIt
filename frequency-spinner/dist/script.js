const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

let time = 0;
let rot = 0;

// Controls
const controlToggle = document.getElementById("controlToggle");
const controls = document.getElementById("controls");

const numShapesSlider = document.getElementById("numShapes");
const spacingSlider = document.getElementById("spacing");
const freqSlider = document.getElementById("frequency");
const resonanceSlider = document.getElementById("resonance");
const modulationSlider = document.getElementById("modulation");
const lineColorInput = document.getElementById("lineColor");
const bgColorInput = document.getElementById("bgColor");
const trailSlider = document.getElementById("trail");
const glowSlider = document.getElementById("glow");
const lineWidthSlider = document.getElementById("lineWidth");
const rotSpeedSlider = document.getElementById("rotSpeed");
const jiggleSlider = document.getElementById("jiggle");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const importJson = document.getElementById("importJson");

// Default settings JSON
const defaultSettings = {
  "numShapes":"17",
  "spacing":"48",
  "frequency":"5",
  "resonance":"40",
  "modulation":"25",
  "lineColor":"#ffffff",
  "bgColor":"#000000",
  "trail":"0.3",
  "glow":"30",
  "lineWidth":"2",
  "rotSpeed":"0.05",
  "jiggle":"20"
};

// Apply default settings
function applySettings(settings){
  numShapesSlider.value = settings.numShapes;
  spacingSlider.value = settings.spacing;
  freqSlider.value = settings.frequency;
  resonanceSlider.value = settings.resonance;
  modulationSlider.value = settings.modulation;
  lineColorInput.value = settings.lineColor;
  bgColorInput.value = settings.bgColor;
  trailSlider.value = settings.trail;
  glowSlider.value = settings.glow;
  lineWidthSlider.value = settings.lineWidth;
  rotSpeedSlider.value = settings.rotSpeed;
  jiggleSlider.value = settings.jiggle;
}
applySettings(defaultSettings);

// Toggle control panel
controlToggle.addEventListener("click", () => {
  controls.style.display = controls.style.display === "none" ? "block" : "none";
});

// Save settings as JSON
saveBtn.addEventListener("click", () => {
  const settings = {
    numShapes: numShapesSlider.value,
    spacing: spacingSlider.value,
    frequency: freqSlider.value,
    resonance: resonanceSlider.value,
    modulation: modulationSlider.value,
    lineColor: lineColorInput.value,
    bgColor: bgColorInput.value,
    trail: trailSlider.value,
    glow: glowSlider.value,
    lineWidth: lineWidthSlider.value,
    rotSpeed: rotSpeedSlider.value,
    jiggle: jiggleSlider.value
  };
  const json = JSON.stringify(settings);
  prompt("Copy your settings JSON:", json);
});

// Load settings from JSON
loadBtn.addEventListener("click", () => {
  try {
    const settings = JSON.parse(importJson.value);
    applySettings(settings);
    alert("Settings loaded!");
  } catch(e) {
    alert("Invalid JSON");
  }
});

function drawWave(cx, cy, baseRadius, timeOffset, rotOffset, freq, resonance, modulation, color, shadowBlur, lineWidth, jiggleAmount) {
  const numPoints = 400;
  const amplitude = resonance + Math.sin((time + timeOffset) * 0.1) * modulation;

  ctx.beginPath();
  for (let i = 0; i <= numPoints; i++) {
    const frac = i / numPoints;
    const theta = frac * Math.PI * 2;
    const wave = Math.sin(freq * theta + time + timeOffset) * amplitude;
    const jiggle = Math.sin(time*2 + i*0.5) * jiggleAmount;
    const r = baseRadius + wave + jiggle;

    const thetaRot = theta + rot + rotOffset;
    const x = cx + Math.cos(thetaRot) * r;
    const y = cy + Math.sin(thetaRot) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = shadowBlur;
  ctx.stroke();
}

function draw() {
  const bgColor = bgColorInput.value;
  const lineColor = lineColorInput.value;
  const trail = parseFloat(trailSlider.value);
  const shadowBlur = parseInt(glowSlider.value);
  const lineWidth = parseInt(lineWidthSlider.value);
  const rotationSpeed = parseFloat(rotSpeedSlider.value);
  const numShapes = parseInt(numShapesSlider.value);
  const spacing = parseInt(spacingSlider.value);
  const freq = parseInt(freqSlider.value);
  const resonance = parseInt(resonanceSlider.value);
  const modulation = parseInt(modulationSlider.value);
  const jiggleAmount = parseFloat(jiggleSlider.value);

  ctx.fillStyle = `rgba(0,0,0,${1-trail})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let i = 0; i < numShapes; i++) {
    const baseRadius = 50 + i * spacing;
    const timeOffset = i * 40;
    const rotOffset = i * 0.3;
    ctx.globalAlpha = 1;
    drawWave(cx, cy, baseRadius, timeOffset, rotOffset, freq, resonance, modulation, lineColor, shadowBlur, lineWidth, jiggleAmount);
  }

  time += 0.15;
  rot += rotationSpeed;

  requestAnimationFrame(draw);
}

draw();