import * as THREE from 'https://unpkg.com/three@0.158.0?module';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js?module';

(() => {
  const els = {
    sceneWrap: document.getElementById('scene'),
    animate: document.getElementById('animate'),
    arms: document.getElementById('arms'),
    depth: document.getElementById('depth'),
    angle: document.getElementById('angle'),
    tilt: document.getElementById('tilt'),
    scale: document.getElementById('scale'),
    length: document.getElementById('length'),
    thickness: document.getElementById('thickness'),
    pulse: document.getElementById('pulse'),
    pulseSpeed: document.getElementById('pulseSpeed'),
    twist: document.getElementById('twist'),
    spin: document.getElementById('spin'),
    animateVal: document.getElementById('animateVal'),
    armsVal: document.getElementById('armsVal'),
    depthVal: document.getElementById('depthVal'),
    angleVal: document.getElementById('angleVal'),
    tiltVal: document.getElementById('tiltVal'),
    scaleVal: document.getElementById('scaleVal'),
    lengthVal: document.getElementById('lengthVal'),
    thicknessVal: document.getElementById('thicknessVal'),
    pulseVal: document.getElementById('pulseVal'),
    pulseSpeedVal: document.getElementById('pulseSpeedVal'),
    twistVal: document.getElementById('twistVal'),
    spinVal: document.getElementById('spinVal'),
    randomize: document.getElementById('randomize'),
    reset: document.getElementById('reset')
  };

  const defaults = {
    arms: 12,
    depth: 5,
    angle: 30,
    tilt: 15,
    scale: 0.67,
    length: 3.5,
    thickness: 0.12,
    pulse: 10,
    pulseSpeed: 0.6,
    twist: 0,
    spin: 20
  };

  let renderer, scene, camera, controls, root;
  let armMeshes = []; // Instanced meshes per arm
  let builtArms = defaults.arms;
  let builtDepth = defaults.depth;
  let segsPerArm = Math.pow(2, defaults.depth) - 1;
  let phase = 0;

  function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x07070c, 1);
    els.sceneWrap.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(4, 8, 6);
    scene.add(dir);

    root = new THREE.Group();
    scene.add(root);

    window.addEventListener('resize', onResize);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function readParams() {
    const arms = clamp(parseInt(els.arms.value, 10), 3, 64);
    const depth = clamp(parseInt(els.depth.value, 10), 1, 9);
    const angleDeg = clamp(parseFloat(els.angle.value), 0, 120);
    const tiltDeg = clamp(parseFloat(els.tilt.value), 0, 85);
    const scale = clamp(parseFloat(els.scale.value), 0.3, 0.95);
    const length = clamp(parseFloat(els.length.value), 0.1, 20);
    const thickness = clamp(parseFloat(els.thickness.value), 0.01, 2);
    const pulse = clamp(parseFloat(els.pulse.value), 0, 90);
    const pulseSpeed = clamp(parseFloat(els.pulseSpeed.value), 0, 5);
    const twistDeg = clamp(parseFloat(els.twist.value), 0, 180);
    const spin = clamp(parseFloat(els.spin.value), -360, 360);
    return { arms, depth, angleDeg, tiltDeg, scale, length, thickness, pulse, pulseSpeed, twistDeg, spin };
  }

  function updateLabels(p) {
    els.animateVal.textContent = els.animate.checked ? 'On' : 'Off';
    els.armsVal.textContent = String(p.arms);
    els.depthVal.textContent = String(p.depth);
    els.angleVal.textContent = String(p.angleDeg);
    els.tiltVal.textContent = String(p.tiltDeg);
    els.scaleVal.textContent = formatNum(p.scale);
    els.lengthVal.textContent = formatNum(p.length);
    els.thicknessVal.textContent = formatNum(p.thickness);
    els.pulseVal.textContent = String(p.pulse);
    els.pulseSpeedVal.textContent = formatNum(p.pulseSpeed);
    els.twistVal.textContent = String(p.twistDeg);
    els.spinVal.textContent = String(p.spin);
  }

  function formatNum(n) { return (Math.round(n * 100) / 100).toString(); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function clearRoot() {
    for (const m of armMeshes) {
      if (m) {
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
        root.remove(m);
      }
    }
    armMeshes = [];
  }

  // Build all arm instanced meshes
  function rebuild() {
    clearRoot();
    const p = readParams();
    updateLabels(p);
    segsPerArm = Math.pow(2, p.depth) - 1;
    const baseGeom = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);

    for (let i = 0; i < p.arms; i++) {
      const hue = (i / p.arms) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 0.75, 0.55);
      const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.5 });
      const inst = new THREE.InstancedMesh(baseGeom, mat, segsPerArm);
      inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      root.add(inst);
      armMeshes.push(inst);

      // Set transforms recursively for this arm
      let index = 0;
      const theta = (i / p.arms) * Math.PI * 2;
      const armQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta);
      const startPos = new THREE.Vector3(0, 0, 0);

      const up = new THREE.Vector3(0, 1, 0);
      const fwdLocal = new THREE.Vector3(1, 0, 0);

      const tmpQuat = new THREE.Quaternion();
      const tmpMat = new THREE.Matrix4();
      const tmpAxis = new THREE.Vector3();

      function addSegment(from, to, radius, idx) {
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(to, from).normalize();
        // orient cylinder Y axis to dir
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const len = from.distanceTo(to);
        const s = new THREE.Vector3(radius, len, radius);
        tmpMat.compose(mid, q, s);
        inst.setMatrixAt(idx, tmpMat);
      }

      function recurse(pos, quat, len, level) {
        if (level <= 0 || len < 0.01) return;
        // forward vector in world
        const fwd = fwdLocal.clone().applyQuaternion(quat);
        const end = pos.clone().add(fwd.multiplyScalar(len));
        const radius = Math.max(0.01, p.thickness * (level * 0.45));
        addSegment(pos, end, radius, index++);

        const nextLen = len * p.scale;
        const yaw = (p.angleDeg * Math.PI) / 180;
        const pitch = (p.tiltDeg * Math.PI) / 180;
        const twist = (p.twistDeg * Math.PI) / 180;

        // Left branch: yaw -, pitch +
        const zAxisW = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        const yAxisW = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        const xAxisW = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

        const qLeft = quat.clone()
          .multiply(tmpQuat.setFromAxisAngle(zAxisW, -yaw))
          .multiply(tmpQuat.setFromAxisAngle(yAxisW, pitch))
          .multiply(tmpQuat.setFromAxisAngle(xAxisW, twist));
        recurse(end, qLeft, nextLen, level - 1);

        // Right branch: yaw +, pitch -
        const qRight = quat.clone()
          .multiply(tmpQuat.setFromAxisAngle(zAxisW, yaw))
          .multiply(tmpQuat.setFromAxisAngle(yAxisW, -pitch))
          .multiply(tmpQuat.setFromAxisAngle(xAxisW, twist));
        recurse(end, qRight, nextLen, level - 1);
      }

      recurse(startPos, armQuat, p.length, p.depth);
      inst.instanceMatrix.needsUpdate = true;
    }

    builtArms = p.arms;
    builtDepth = p.depth;
  }

  function updateArmTransforms(p, angleEffDeg) {
    // Update per-arm instanced matrices without rebuilding geometry
    const baseGeomCount = segsPerArm;
    for (let i = 0; i < armMeshes.length; i++) {
      const inst = armMeshes[i];
      if (!inst) continue;
      let index = 0;
      const theta = (i / p.arms) * Math.PI * 2;
      const armQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta);
      const startPos = new THREE.Vector3(0, 0, 0);
      const fwdLocal = new THREE.Vector3(1, 0, 0);
      const tmpQuat = new THREE.Quaternion();
      const tmpMat = new THREE.Matrix4();

      function addSegment(from, to, radius, idx) {
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(to, from).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const len = from.distanceTo(to);
        const s = new THREE.Vector3(radius, len, radius);
        tmpMat.compose(mid, q, s);
        inst.setMatrixAt(idx, tmpMat);
      }
      function recurse(pos, quat, len, level) {
        if (level <= 0 || len < 0.01) return;
        const fwd = fwdLocal.clone().applyQuaternion(quat);
        const end = pos.clone().add(fwd.multiplyScalar(len));
        const radius = Math.max(0.01, p.thickness * (level * 0.45));
        addSegment(pos, end, radius, index++);
        const nextLen = len * p.scale;
        const yaw = (angleEffDeg * Math.PI) / 180;
        const pitch = (p.tiltDeg * Math.PI) / 180;
        const twist = (p.twistDeg * Math.PI) / 180;
        const zAxisW = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        const yAxisW = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        const xAxisW = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
        const qLeft = quat.clone()
          .multiply(tmpQuat.setFromAxisAngle(zAxisW, -yaw))
          .multiply(tmpQuat.setFromAxisAngle(yAxisW, pitch))
          .multiply(tmpQuat.setFromAxisAngle(xAxisW, twist));
        recurse(end, qLeft, nextLen, level - 1);
        const qRight = quat.clone()
          .multiply(tmpQuat.setFromAxisAngle(zAxisW, yaw))
          .multiply(tmpQuat.setFromAxisAngle(yAxisW, -pitch))
          .multiply(tmpQuat.setFromAxisAngle(xAxisW, twist));
        recurse(end, qRight, nextLen, level - 1);
      }
      recurse(startPos, armQuat, p.length, p.depth);
      inst.instanceMatrix.needsUpdate = true;
    }
  }

  function attachEvents() {
    window.addEventListener('resize', onResize);
    ['arms','depth','angle','tilt','scale','length','thickness','pulse','pulseSpeed','twist','spin'].forEach(id => {
      els[id].addEventListener('input', () => { rebuild(); });
      els[id].addEventListener('change', () => { rebuild(); });
    });
    els.animate.addEventListener('change', () => {
      els.animateVal.textContent = els.animate.checked ? 'On' : 'Off';
    });

    els.randomize.addEventListener('click', () => {
      els.arms.value = String(randInt(6, 20));
      els.depth.value = String(randInt(3, 6));
      els.angle.value = String(randInt(15, 60));
      els.tilt.value = String(randInt(5, 35));
      els.scale.value = String(randFloat(0.58, 0.78).toFixed(2));
      els.length.value = String(randFloat(2.2, 5.0).toFixed(1));
      els.thickness.value = String(randFloat(0.08, 0.18).toFixed(2));
      els.pulse.value = String(randInt(0, 20));
      els.pulseSpeed.value = String(randFloat(0.0, 1.2).toFixed(2));
      els.twist.value = String(randInt(0, 24));
      els.spin.value = String(randInt(-60, 60));
      rebuild();
    });

    els.reset.addEventListener('click', () => {
      els.arms.value = String(defaults.arms);
      els.depth.value = String(defaults.depth);
      els.angle.value = String(defaults.angle);
      els.tilt.value = String(defaults.tilt);
      els.scale.value = String(defaults.scale);
      els.length.value = String(defaults.length);
      els.thickness.value = String(defaults.thickness);
      els.pulse.value = String(defaults.pulse);
      els.pulseSpeed.value = String(defaults.pulseSpeed);
      els.twist.value = String(defaults.twist);
      els.spin.value = String(defaults.spin);
      els.animate.checked = true;
      rebuild();
    });
  }

  function randInt(a, b){ return Math.floor(a + Math.random() * (b - a + 1)); }
  function randFloat(a, b){ return a + Math.random() * (b - a); }

  // Animation
  let last = 0;
  function tick(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;

    controls.update();
    const p = readParams();
    if (els.animate.checked) {
      root.rotation.y += (p.spin * Math.PI / 180) * dt;
    }

    // Pulse angle animation
    phase += p.pulseSpeed * dt * Math.PI * 2;
    const angleOsc = Math.sin(phase) * p.pulse;

    // If topology changed, rebuild; else update instanced transforms
    if (p.arms !== builtArms || p.depth !== builtDepth) {
      rebuild();
    } else {
      updateArmTransforms(p, p.angleDeg + angleOsc);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // boot
  init();
  attachEvents();
  rebuild();
  requestAnimationFrame(tick);
})();
