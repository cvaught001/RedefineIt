
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const controls = document.getElementById('controls');
const toggleBtn = document.getElementById('controlToggle');

const presetSelect = document.getElementById('presetSelect');
const presetNameInput = document.getElementById('presetName');
const savePresetBtn = document.getElementById('savePresetBtn');
const saveJsonBtn = document.getElementById('saveJsonBtn');
const loadBtn = document.getElementById('loadBtn');
const presetFile = document.getElementById('presetFile');

const numShapesInput = document.getElementById('numShapes');
const spacingInput = document.getElementById('spacing');
const freqInput = document.getElementById('frequency');
const resonanceInput = document.getElementById('resonance');
const modulationInput = document.getElementById('modulation');
const waveformSelect = document.getElementById('waveform');
const lineColorInput = document.getElementById('lineColor');
const trailInput = document.getElementById('trail');
const glowInput = document.getElementById('glow');
const lineWidthInput = document.getElementById('lineWidth');
const rotSpeedInput = document.getElementById('rotSpeed');
const jiggleInput = document.getElementById('jiggle');

// Canvas sizing
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// State for rotation / zoom
let time = 0, rot = 0;
let rotX = 0, rotY = 0, targetRotX = 0, targetRotY = 0;
let zoom = 1, zoomedOut = false;

// Drag / click detection (to avoid click toggling zoom while dragging)
let dragging = false, dragStartX = 0, dragStartY = 0, lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', e=>{
  dragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('mouseup', e=>{
  if(!dragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragging = false;
  // small movement -> treat as click (toggle zoom)
  if(Math.hypot(dx,dy) < 6){
    zoomedOut = !zoomedOut;
    zoom = zoomedOut ? 0.6 : 1;
  }
});
canvas.addEventListener('mousemove', e=>{
  if(dragging){
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    // rotate based on drag delta
    targetRotY += dx * 0.006;
    targetRotX += dy * 0.006;
    lastX = e.clientX;
    lastY = e.clientY;
  } else {
    // gentle hover-based rotation (non-drag)
    const cx = canvas.width/2, cy = canvas.height/2;
    targetRotY = (e.clientX - cx) / cx * Math.PI * 0.5;
    targetRotX = (e.clientY - cy) / cy * Math.PI * 0.5;
  }
});

// Preset collection (array of {name, settings})
let presets = [
  { name: "Custom Square", settings: {
    numShapes:"13", spacing:"48", frequency:"1", resonance:"40", modulation:"25",
    waveform:"square", lineColor:"#ffffff", trail:"0", glow:"0", lineWidth:"1", rotSpeed:"0", jiggle:"0"
  }},
  { name: "Original", settings: {
    numShapes:"17", spacing:"48", frequency:"5", resonance:"40", modulation:"25",
    waveform:"sine", lineColor:"#ffffff", trail:"0.2", glow:"20", lineWidth:"2", rotSpeed:"0.01", jiggle:"20"
  }}
  ,
  { name: "LifeForm", settings: {
  "numShapes": "3",
  "spacing": "48",
  "frequency": "1",
  "resonance": "40",
  "modulation": "25",
  "waveform": "square",
  "lineColor": "#ffffff",
  "trail": "0.7",
  "glow": "0",
  "lineWidth": "10",
  "rotSpeed": "0.05",
  "jiggle": "0"
}},
  { name: "LifeFormB", settings: {
  "numShapes": "1",
  "spacing": "8",
  "frequency": "2.7",
  "resonance": "125",
  "modulation": "7",
  "waveform": "square",
  "lineColor": "#ff0000",
  "trail": "0.63",
  "glow": "0",
  "lineWidth": "2",
  "rotSpeed": "-0.175",
  "jiggle": "5"
}}
];

// Dropdown rebuild
function rebuildPresetDropdown(){
  presetSelect.innerHTML = '';
  presets.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });
}
rebuildPresetDropdown();

// Apply given settings object to inputs (uses defaults safely)
function applySettings(s){
  if(!s) return;
  numShapesInput.value = s.numShapes ?? numShapesInput.value;
  spacingInput.value = s.spacing ?? spacingInput.value;
  freqInput.value = s.frequency ?? freqInput.value;
  resonanceInput.value = s.resonance ?? resonanceInput.value;
  modulationInput.value = s.modulation ?? modulationInput.value;
  waveformSelect.value = s.waveform ?? waveformSelect.value;
  lineColorInput.value = s.lineColor ?? lineColorInput.value;
  trailInput.value = s.trail ?? trailInput.value;
  glowInput.value = s.glow ?? glowInput.value;
  lineWidthInput.value = s.lineWidth ?? lineWidthInput.value;
  rotSpeedInput.value = s.rotSpeed ?? rotSpeedInput.value;
  jiggleInput.value = s.jiggle ?? jiggleInput.value;
}
applySettings(presets[0].settings);

// Collect current settings from controls
function collectSettings(){
  return {
    numShapes: String(numShapesInput.value),
    spacing: String(spacingInput.value),
    frequency: String(freqInput.value),
    resonance: String(resonanceInput.value),
    modulation: String(modulationInput.value),
    waveform: waveformSelect.value,
    lineColor: lineColorInput.value,
    trail: String(trailInput.value),
    glow: String(glowInput.value),
    lineWidth: String(lineWidthInput.value),
    rotSpeed: String(rotSpeedInput.value),
    jiggle: String(jiggleInput.value)
  };
}

// Toggle display
toggleBtn.addEventListener('click', ()=> {
  controls.style.display = (controls.style.display === 'none' ? 'block' : 'none');
});

// Preset selection
presetSelect.addEventListener('change', ()=>{
  const idx = parseInt(presetSelect.value);
  if(Number.isInteger(idx) && presets[idx]) applySettings(presets[idx].settings);
});

// Save as preset -> push to array + download JSON
savePresetBtn.addEventListener('click', ()=>{
  const name = presetNameInput.value.trim() || `Preset ${presets.length+1}`;
  const settings = collectSettings();
  presets.push({ name, settings });
  rebuildPresetDropdown();
  presetSelect.value = presets.length - 1;
  // download updated presets.json
  try {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presets.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    alert(`Preset "${name}" saved and presets.json downloaded.`);
  } catch (e) {
    console.error(e);
    alert('Could not download preset file.');
  }
});

// Copy current settings JSON to clipboard
saveJsonBtn.addEventListener('click', async ()=>{
  const s = collectSettings();
  const json = JSON.stringify(s, null, 2);
  if(navigator.clipboard && navigator.clipboard.writeText){
    try { await navigator.clipboard.writeText(json); alert('Settings JSON copied to clipboard'); return; }
    catch(e){ /* fallback */ }
  }
  // fallback prompt
  prompt('Copy settings JSON:', json);
});

// Load presets from local file (accepts array-of-presets OR object map)
loadBtn.addEventListener('click', ()=> presetFile.click());
presetFile.addEventListener('change', (ev)=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      // Accept either an array of {name,settings} OR object mapping name->settings OR object with top-level 'presets' array
      let newPresets = [];
      if(Array.isArray(parsed) && parsed.every(it => it && typeof it.name === 'string' && it.settings)) {
        newPresets = parsed;
      } else if (Array.isArray(parsed) && parsed.every(it => it && typeof it === 'object' && it.settings && it.name)) {
        newPresets = parsed;
      } else if (parsed.presets && Array.isArray(parsed.presets)) {
        newPresets = parsed.presets;
      } else if (parsed && typeof parsed === 'object') {
        // object mapping name => settings
        newPresets = Object.keys(parsed).map(k => ({ name: k, settings: parsed[k] }));
        throw new Error('Unrecognized JSON format');
      }
      presets = newPresets;
      rebuildPresetDropdown();
      applySettings(presets[0]?.settings ?? {});
      alert('Presets loaded successfully.');
    } catch(err){
      console.error(err);
      alert('Failed to load presets: invalid JSON format.');
    }
  };
  reader.readAsText(file);
  // clear input so same file can be re-loaded later if desired
  presetFile.value = '';
});

// Waveforms function
function waveFunc(type, phase){
  switch(type){
    case 'sine': return Math.sin(phase);
    case 'square': return Math.sign(Math.sin(phase));
    case 'triangle': {
      // triangle from -1..1
      return 2 * Math.abs(2 * ((phase / (2*Math.PI)) - Math.floor((phase / (2*Math.PI)) + 0.5))) - 1;
    }
    case 'sawtooth':
      return 2 * ((phase/(2*Math.PI)) - Math.floor(phase/(2*Math.PI) + 0.5));
    case 'pulse':
      return (Math.sin(phase) > 0) ? 1 : -1;
    default: return Math.sin(phase);
  }
}

// draw one ring with ghost lines
function drawWave3D(cx, cy, baseRadius, timeOffset, rotOffset, freq, resonance, modulation, waveform, color, shadowBlur, lineWidth, jiggle){
  const points = 360;
  const fadeLines = 10;
  for(let g=0; g<fadeLines; g++){
    ctx.beginPath();
    for(let i=0; i<=points; i++){
      const frac = i / points;
      const theta = frac * Math.PI * 2;
      const phase = freq * theta + time + timeOffset + g * 0.03;
      const wave = waveFunc(waveform, phase) * (resonance + Math.sin((time + timeOffset + g*0.03)*0.1) * modulation);
      const jig = Math.sin(time*2 + i*0.5) * jiggle;
      const r = baseRadius + wave + jig + g*2;

      // base 2D
      let x = Math.cos(theta + rot + rotOffset) * r;
      let y = Math.sin(theta + rot + rotOffset) * r;
      let z = Math.sin(theta*0.5 + time*0.5) * 50;

      // rotate by rotX/rotY
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      const perspective = (400 / (400 + z2)) * zoom;
      const fx = cx + x1 * perspective;
      const fy = cy + y1 * perspective;

      if(i === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    }
    ctx.closePath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1 - (g / fadeLines);
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// animation loop
function draw(){
  // smooth rotation interpolation
  rotX += (targetRotX - rotX) * 0.06;
  rotY += (targetRotY - rotY) * 0.06;

  // collect current settings (string values from inputs)
  const settings = collectSettings();

  // clear with trail alpha
  const trail = parseFloat(settings.trail);
  ctx.fillStyle = `rgba(0,0,0,${1 - trail})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const numShapes = parseInt(settings.numShapes);
  const spacing = parseFloat(settings.spacing);
  const freq = parseFloat(settings.frequency);
  const resonance = parseFloat(settings.resonance);
  const modulation = parseFloat(settings.modulation);
  const lineColor = settings.lineColor;
  const shadowBlur = parseInt(settings.glow);
  const lineWidth = parseFloat(settings.lineWidth);
  const rotationSpeed = parseFloat(settings.rotSpeed);
  const jiggle = parseFloat(settings.jiggle);
  const waveform = settings.waveform;

  // center
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for(let i=0;i<numShapes;i++){
    const baseRadius = 50 + i * spacing;
    const timeOffset = i * 35;
    const rotOffset = i * 0.28;
    drawWave3D(cx, cy, baseRadius, timeOffset, rotOffset, freq, resonance, modulation, waveform, lineColor, shadowBlur, lineWidth, jiggle);
  }

  time += 0.15;
  rot += rotationSpeed;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

