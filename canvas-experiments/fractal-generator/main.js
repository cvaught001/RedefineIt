(() => {
  const canvas = document.getElementById('fractalCanvas');
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d', { alpha: false });

  const els = {
    animate: document.getElementById('animate'),
    morph: document.getElementById('morph'),
    arms: document.getElementById('arms'),
    depth: document.getElementById('depth'),
    angle: document.getElementById('angle'),
    scale: document.getElementById('scale'),
    length: document.getElementById('length'),
    spin: document.getElementById('spin'),
    pulse: document.getElementById('pulse'),
    pulseSpeed: document.getElementById('pulseSpeed'),
    toggleUi: document.getElementById('toggleUi'),
    morphDuration: document.getElementById('morphDuration'),
    morphHold: document.getElementById('morphHold'),
    morphUsePresets: document.getElementById('morphUsePresets'),
    presetSelect: document.getElementById('presetSelect'),
    presetName: document.getElementById('presetName'),
    presetRename: document.getElementById('presetRename'),
    presetSave: document.getElementById('presetSave'),
    animateVal: document.getElementById('animateVal'),
    morphVal: document.getElementById('morphVal'),
    armsVal: document.getElementById('armsVal'),
    depthVal: document.getElementById('depthVal'),
    angleVal: document.getElementById('angleVal'),
    scaleVal: document.getElementById('scaleVal'),
    lengthVal: document.getElementById('lengthVal'),
    spinVal: document.getElementById('spinVal'),
    pulseVal: document.getElementById('pulseVal'),
    pulseSpeedVal: document.getElementById('pulseSpeedVal'),
    morphDurationVal: document.getElementById('morphDurationVal'),
    morphHoldVal: document.getElementById('morphHoldVal'),
    randomize: document.getElementById('randomize'),
    reset: document.getElementById('reset'),
    saveJson: document.getElementById('saveJson'),
    loadJson: document.getElementById('loadJson'),
  };

  const defaults = {
    arms: 12,
    depth: 6,
    angle: 30,
    scale: 0.67,
    length: 0.25,
    spin: 30,        // degrees per second
    pulse: 10,       // +/- degrees of angle pulse
    pulseSpeed: 0.6, // cycles per second multiplier
  };

  let DPR = 1;
  function setCanvasSize() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    DPR = dpr;
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function readParams() {
    const arms = clamp(parseInt(els.arms.value, 10), 3, 96);
    const depth = clamp(parseInt(els.depth.value, 10), 1, 12);
    const angleDeg = clamp(parseFloat(els.angle.value), 0, 120);
    const scale = clamp(parseFloat(els.scale.value), 0.3, 0.95);
    const length = clamp(parseFloat(els.length.value), 0.05, 0.85);
    const spin = clamp(parseFloat(els.spin.value), -360, 360);
    const pulse = clamp(parseFloat(els.pulse.value), 0, 90);
    const pulseSpeed = clamp(parseFloat(els.pulseSpeed.value), 0, 5);
    return { arms, depth, angleDeg, scale, length, spin, pulse, pulseSpeed };
  }

  function updateLabels(p) {
    els.animateVal.textContent = els.animate.checked ? 'On' : 'Off';
    if (els.morphVal) els.morphVal.textContent = els.morph?.checked ? 'On' : 'Off';
    els.armsVal.textContent = String(p.arms);
    els.depthVal.textContent = String(p.depth);
    els.angleVal.textContent = formatNum(p.angleDeg);
    els.scaleVal.textContent = formatNum(p.scale);
    els.lengthVal.textContent = formatNum(p.length);
    els.spinVal.textContent = formatNum(p.spin);
    els.pulseVal.textContent = formatNum(p.pulse);
    els.pulseSpeedVal.textContent = formatNum(p.pulseSpeed);
    if (els.morphDurationVal && els.morphDuration) els.morphDurationVal.textContent = formatNum(Number(els.morphDuration.value));
    if (els.morphHoldVal && els.morphHold) els.morphHoldVal.textContent = formatNum(Number(els.morphHold.value));
  }

  function formatNum(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function clearCanvas() {
    const { width, height } = canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Soft vignette background
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.1,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.6
    );
    g.addColorStop(0, '#0b0b12');
    g.addColorStop(1, '#05050a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function draw(state, paramsOverride) {
    setCanvasSize();
    clearCanvas();
    const p = paramsOverride || readParams();
    updateLabels(p);

    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    const cx = w / 2;
    const cy = h / 2;
    const baseLen = Math.min(w, h) * p.length;
    const rotation = state?.rotation || 0;
    const angleOsc = state?.angleOsc || 0;
    const aRad = degToRad(p.angleDeg + angleOsc);

    ctx.save();
    ctx.translate(cx, cy);
    if (rotation) ctx.rotate(rotation);

    for (let i = 0; i < p.arms; i++) {
      const theta = (i / p.arms) * Math.PI * 2;
      const hue = (i / p.arms) * 360;
      ctx.save();
      ctx.rotate(theta);
      drawBranch(0, 0, 0, baseLen, p.depth, p, hue, aRad);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawBranch(x, y, angle, len, depth, p, baseHue, aRad) {
    if (depth <= 0 || len < 0.5) return;

    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;

    const t = depth / (p.depth + 1);
    const sat = 80;
    const light = 35 + (1 - t) * 25; // brighter toward tips

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = Math.max(0.5, depth * 0.9);
    ctx.strokeStyle = `hsl(${baseHue}, ${sat}%, ${light}%)`;
    ctx.stroke();

    const nextLen = len * p.scale;

    // Left and right branches
    drawBranch(x2, y2, angle - aRad, nextLen, depth - 1, p, baseHue, aRad);
    drawBranch(x2, y2, angle + aRad, nextLen, depth - 1, p, baseHue, aRad);
  }

  function attachEvents() {
    window.addEventListener('resize', () => {
      draw();
    });

    ['arms', 'depth', 'angle', 'scale', 'length', 'spin', 'pulse', 'pulseSpeed'].forEach((id) => {
      els[id].addEventListener('input', draw);
      els[id].addEventListener('change', draw);
    });

    els.animate.addEventListener('change', () => {
      if (els.animate.checked || els.morph?.checked) startAnimation();
      else stopAnimation();
      draw();
    });

    if (els.morph) {
      els.morph.addEventListener('change', () => {
        readMorphControls();
        if (els.morph.checked) {
          // kick off morph cycle and ensure RAF
          morph.from = null; // will initialize next frame
          morph.to = null;
          morph.t = 0;
          morph.holding = 0;
          startAnimation();
        } else if (!els.animate.checked) {
          stopAnimation();
        }
        draw();
      });
    }
    if (els.morphDuration) {
      const upd = () => { readMorphControls(); draw(); };
      els.morphDuration.addEventListener('input', upd);
      els.morphDuration.addEventListener('change', upd);
    }
    if (els.morphHold) {
      const upd = () => { readMorphControls(); draw(); };
      els.morphHold.addEventListener('input', upd);
      els.morphHold.addEventListener('change', upd);
    }
    if (els.morphUsePresets) {
      els.morphUsePresets.addEventListener('change', () => { readMorphControls(); });
    }

    els.randomize.addEventListener('click', () => {
      els.arms.value = String(randInt(6, 36));
      els.depth.value = String(randInt(4, 9));
      els.angle.value = String(randInt(15, 65));
      els.scale.value = String(randFloat(0.55, 0.78).toFixed(2));
      els.length.value = String(randFloat(0.18, 0.36).toFixed(2));
      draw();
    });

    els.reset.addEventListener('click', () => {
      els.arms.value = String(defaults.arms);
      els.depth.value = String(defaults.depth);
      els.angle.value = String(defaults.angle);
      els.scale.value = String(defaults.scale);
      els.length.value = String(defaults.length);
      els.spin.value = String(defaults.spin);
      els.pulse.value = String(defaults.pulse);
      els.pulseSpeed.value = String(defaults.pulseSpeed);
      els.animate.checked = false;
      if (els.morph) els.morph.checked = false;
      if (els.morphDuration) els.morphDuration.value = '6';
      if (els.morphHold) els.morphHold.value = '2';
      if (els.morphUsePresets) els.morphUsePresets.checked = true;
      stopAnimation();
      draw();
    });

    // Eye toggle — show/hide controls panel with persistence
    const uiKey = 'fractal_ui_visible';
    function setUiVisible(v) {
      const panel = document.querySelector('.controls');
      if (!panel) return;
      panel.classList.toggle('hidden', !v);
      if (els.toggleUi) els.toggleUi.textContent = v ? '🙈' : '👁';
      try { localStorage.setItem(uiKey, v ? '1' : '0'); } catch (e) {}
    }
    if (els.toggleUi) {
      els.toggleUi.addEventListener('click', () => {
        const panel = document.querySelector('.controls');
        const isVisible = panel && !panel.classList.contains('hidden');
        setUiVisible(!isVisible);
      });
      let pref = '1';
      try { pref = localStorage.getItem(uiKey) || '1'; } catch (e) {}
      setUiVisible(pref !== '0');
    }

    // JSON save/import
    if (els.saveJson) {
      els.saveJson.addEventListener('click', () => {
        const json = JSON.stringify(getSettings(), null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(json).then(
            () => alert('Settings JSON copied to clipboard'),
            () => prompt('Copy settings JSON:', json)
          );
        } else {
          prompt('Copy settings JSON:', json);
        }
      });
    }
    if (els.loadJson) {
      els.loadJson.addEventListener('click', () => {
        const text = prompt('Paste settings JSON:');
        if (!text) return;
        try {
          const obj = JSON.parse(text);
          applySettings(obj);
          draw();
        } catch (e) {
          alert('Invalid JSON');
        }
      });
    }
  }

  function randInt(a, b) {
    return Math.floor(a + Math.random() * (b - a + 1));
  }
  function randFloat(a, b) {
    return a + Math.random() * (b - a);
  }

  function degToRad(d) { return (d * Math.PI) / 180; }

  function getSettings() {
    return {
      animate: Boolean(els.animate.checked),
      morph: Boolean(els.morph?.checked),
      arms: clamp(parseInt(els.arms.value, 10), 3, 96),
      depth: clamp(parseInt(els.depth.value, 10), 1, 12),
      angleDeg: clamp(parseFloat(els.angle.value), 0, 120),
      scale: clamp(parseFloat(els.scale.value), 0.3, 0.95),
      length: clamp(parseFloat(els.length.value), 0.05, 0.85),
      spin: clamp(parseFloat(els.spin.value), -360, 360),
      pulse: clamp(parseFloat(els.pulse.value), 0, 90),
      pulseSpeed: clamp(parseFloat(els.pulseSpeed.value), 0, 5),
    };
  }

  function applySettings(s) {
    if (!s || typeof s !== 'object') return;
    if (typeof s.arms === 'number') els.arms.value = String(s.arms);
    if (typeof s.depth === 'number') els.depth.value = String(s.depth);
    if (typeof s.angleDeg === 'number') els.angle.value = String(s.angleDeg);
    if (typeof s.scale === 'number') els.scale.value = String(s.scale);
    if (typeof s.length === 'number') els.length.value = String(s.length);
    if (typeof s.spin === 'number') els.spin.value = String(s.spin);
    if (typeof s.pulse === 'number') els.pulse.value = String(s.pulse);
    if (typeof s.pulseSpeed === 'number') els.pulseSpeed.value = String(s.pulseSpeed);
    if (typeof s.animate === 'boolean') {
      els.animate.checked = s.animate;
      if (s.animate) startAnimation(); else stopAnimation();
    }
    if (typeof s.morph === 'boolean' && els.morph) {
      els.morph.checked = s.morph;
      if (s.morph) {
        // initialize a new morph cycle
        morph.from = null;
        morph.to = null;
        morph.t = 0;
        morph.holding = 0;
        startAnimation();
      } else if (!els.animate.checked) {
        stopAnimation();
      }
    }
  }

  // Animation loop
  let rafId = 0;
  let lastTs = 0;
  let rotationAcc = 0; // in radians
  let phase = 0;       // for pulsing

  function frame(ts) {
    if (!rafId) return; // cancelled mid-frame
    if (!lastTs) lastTs = ts;
    const dt = Math.max(0, Math.min(0.05, (ts - lastTs) / 1000)); // clamp dt
    lastTs = ts;

    readMorphControls();
    let pBase = readParams();

    // Morphing logic
    let pEff = pBase;
    if (morph.on) {
      if (!morph.from || !morph.to) {
        morph.from = { ...pBase };
        morph.to = nextMorphTarget();
        morph.t = 0;
        morph.holding = 0;
      } else if (morph.holding > 0) {
        morph.holding -= dt;
        if (morph.holding <= 0) {
          // start next morph cycle from current effective
          morph.from = { ...pEff };
          morph.to = nextMorphTarget();
          morph.t = 0;
          morph.holding = 0;
        }
      } else {
        morph.t += (dt / Math.max(0.001, morph.duration));
        if (morph.t >= 1) {
          morph.t = 1;
          morph.holding = Math.max(0, morph.hold);
        }
      }
      const te = easeInOut(Math.max(0, Math.min(1, morph.t)));
      pEff = lerpSettings(morph.from || pBase, morph.to || pBase, te);
    }

    rotationAcc += degToRad(pEff.spin) * dt;
    // keep rotation bounded to avoid floating-point blowup
    if (rotationAcc > Math.PI * 4 || rotationAcc < -Math.PI * 4) {
      rotationAcc = ((rotationAcc % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    }

    phase += pEff.pulseSpeed * dt * Math.PI * 2; // cycles per second
    const angleOsc = Math.sin(phase) * pEff.pulse;

    draw({ rotation: rotationAcc, angleOsc }, pEff);
    rafId = requestAnimationFrame(frame);
  }

  function startAnimation() {
    if (rafId) return;
    lastTs = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stopAnimation() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // Morphing state
  const morph = {
    on: false,
    t: 0,
    duration: 6, // seconds
    hold: 2,     // seconds pause at target
    holding: 0,
    from: null,
    to: null,
    usePresets: true,
  };

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  function mix(a, b, t) { return a + (b - a) * t; }

  function lerpSettings(a, b, t) {
    // guard
    if (!a) return b;
    if (!b) return a;
    const r = {};
    r.arms = Math.round(clamp(mix(a.arms, b.arms, t), 3, 96));
    r.depth = Math.round(clamp(mix(a.depth, b.depth, t), 1, 12));
    r.angleDeg = clamp(mix(a.angleDeg, b.angleDeg, t), 0, 120);
    r.scale = clamp(mix(a.scale, b.scale, t), 0.3, 0.95);
    r.length = clamp(mix(a.length, b.length, t), 0.05, 0.85);
    r.spin = clamp(mix(a.spin, b.spin, t), -360, 360);
    r.pulse = clamp(mix(a.pulse, b.pulse, t), 0, 90);
    r.pulseSpeed = clamp(mix(a.pulseSpeed, b.pulseSpeed, t), 0, 5);
    return r;
  }

  function readMorphControls() {
    morph.on = Boolean(els.morph?.checked);
    morph.duration = Number(els.morphDuration?.value || morph.duration) || 6;
    morph.hold = Number(els.morphHold?.value || morph.hold) || 2;
    morph.usePresets = Boolean(els.morphUsePresets?.checked);
  }

  function nextMorphTarget() {
    // pick a new target based on controls and available presets
    if (morph.usePresets && Array.isArray(presets) && presets.length) {
      // choose any preset's settings
      const idx = Math.floor(Math.random() * presets.length);
      return { ...presets[idx].settings };
    }
    // fallback to random preset generator
    if (typeof randomPreset === 'function') return randomPreset('Morph').settings;
    // or derive a random settings object directly
    return {
      arms: randInt(6, 32),
      depth: randInt(3, 8),
      angleDeg: randInt(15, 70),
      scale: Number(randFloat(0.58, 0.78).toFixed(2)),
      length: Number(randFloat(0.18, 0.36).toFixed(2)),
      spin: Number(randFloat(-90, 120).toFixed(1)),
      pulse: randInt(0, 20),
      pulseSpeed: Number(randFloat(0.0, 1.2).toFixed(2)),
    };
  }

  // Presets
  const PRESET_LS_KEY = 'fractal_presets_v1';
  const PRESET_SEL_KEY = 'fractal_preset_selected';
  /** @type {{name:string, settings:any}[]} */
  let presets = [];

  function randomPreset(name) {
    const s = {
      animate: false,
      arms: randInt(6, 32),
      depth: randInt(3, 8),
      angleDeg: randInt(15, 70),
      scale: Number(randFloat(0.58, 0.78).toFixed(2)),
      length: Number(randFloat(0.18, 0.36).toFixed(2)),
      spin: Number(randFloat(-90, 120).toFixed(1)),
      pulse: randInt(0, 20),
      pulseSpeed: Number(randFloat(0.0, 1.2).toFixed(2)),
    };
    return { name, settings: s };
  }

  function loadPresets() {
    try {
      const txt = localStorage.getItem(PRESET_LS_KEY);
      if (txt) {
        const arr = JSON.parse(txt);
        if (Array.isArray(arr) && arr.length >= 1) {
          presets = arr;
          return;
        }
      }
    } catch (e) {}
    // default 4 random presets
    presets = [
      randomPreset('Aurora'),
      randomPreset('Nebula'),
      randomPreset('Spiral Bloom'),
      randomPreset('Starburst'),
    ];
  }
  function savePresets() {
    try { localStorage.setItem(PRESET_LS_KEY, JSON.stringify(presets)); } catch (e) {}
  }
  function renderPresetSelect() {
    if (!els.presetSelect) return;
    els.presetSelect.innerHTML = '';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name || `Preset ${i + 1}`;
      els.presetSelect.appendChild(opt);
    });
  }
  function applySelectedPreset(idx) {
    if (!presets[idx]) return;
    applySettings(presets[idx].settings);
    if (els.presetName) els.presetName.value = presets[idx].name || '';
    draw();
  }

  function initPresetsUi() {
    loadPresets();
    renderPresetSelect();
    let sel = 0;
    try { sel = Number(localStorage.getItem(PRESET_SEL_KEY) || '0') || 0; } catch (e) {}
    if (els.presetSelect) {
      els.presetSelect.value = String(Math.min(Math.max(0, sel), presets.length - 1));
      applySelectedPreset(Number(els.presetSelect.value));
      els.presetSelect.addEventListener('change', () => {
        const idx = Number(els.presetSelect.value);
        try { localStorage.setItem(PRESET_SEL_KEY, String(idx)); } catch (e) {}
        applySelectedPreset(idx);
      });
    }
    if (els.presetRename) {
      const doRename = () => {
        const idx = Number(els.presetSelect.value || 0);
        const name = (els.presetName?.value || '').trim() || `Preset ${idx + 1}`;
        if (!presets[idx]) return;
        presets[idx].name = name;
        savePresets();
        renderPresetSelect();
        els.presetSelect.value = String(idx);
      };
      els.presetRename.addEventListener('click', doRename);
      if (els.presetName) els.presetName.addEventListener('change', doRename);
    }
    if (els.presetSave) {
      els.presetSave.addEventListener('click', () => {
        const idx = Number(els.presetSelect.value || 0);
        if (!presets[idx]) return;
        presets[idx].settings = getSettings();
        savePresets();
        alert(`Saved to "${presets[idx].name || `Preset ${idx + 1}`}"`);
      });
    }
  }

  // Initialize
  attachEvents();
  initPresetsUi();
  draw();
})();
