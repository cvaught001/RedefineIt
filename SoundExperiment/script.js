const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const text = "This is a test of the emergency system";
const baseFontSize = 20;
const pulseAmount = 5;
const baseAmplitude = 120;
const frequency = 0.05;
const rhythmSpeed = 0.005;

let startX = Math.random() * canvas.width;

const letters = text.split("").map((char,i)=>({
  char,
  phase: Math.random()*Math.PI*2,
  baseOffset: i*baseFontSize*0.6,
  spacingMultiplier: 1 + Math.random()*0.5,
  sizePhase: Math.random()*Math.PI*2
}));

let t=0;

// Toggles
let toggleState = 0; // 0=letters,1=circles,2=off
let showSine = true;
let soundOn = false;

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioStarted=false;
let oscType = "triangle";
let lfoAmount = 0;
let resonanceValue = 1;
let cutoffValue = 1000;
const numOscPerLetter = 3;

const letterAudio = letters.map(()=> {
  const oscillators=[];
  for(let i=0;i<numOscPerLetter;i++){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type="lowpass";
    filter.frequency.value = cutoffValue;
    filter.Q.value = resonanceValue;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = oscType;
    gain.gain.value = 0.005 + Math.random()*0.005;

    oscillators.push({osc,gain,filter});
  }
  return oscillators;
});

function startAudio(){
  if(!audioStarted){
    audioCtx.resume().then(()=>{
      letterAudio.forEach(arr=>arr.forEach(o=>o.osc.start()));
      audioStarted=true;
    });
  }
}

function yToFrequency(y){
  const minFreq=220,maxFreq=880;
  return maxFreq - (y/canvas.height)*(maxFreq-minFreq);
}

function snapToScale(freq){
  const scale=[261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25];
  let closest=scale[0];
  let minDiff=Math.abs(freq-closest);
  for(let i=1;i<scale.length;i++){
    const diff=Math.abs(freq-scale[i]);
    if(diff<minDiff){ minDiff=diff; closest=scale[i]; }
  }
  return closest;
}

function getBlueColor(i,time){
  return `hsl(210,100%,${50+20*Math.sin(time*0.05+i)}%)`;
}

function draw3DLetter(char,x,y,angle,color,fontSize){
  const depth=5;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.font=`${fontSize}px Arial`;
  for(let i=depth;i>0;i--){
    ctx.fillStyle=`rgba(0,0,50,${0.03+i/30})`;
    ctx.fillText(char,i,i);
  }
  ctx.fillStyle=color;
  ctx.fillText(char,0,0);
  ctx.restore();
}

function draw3DCircle(x,y,radius,color){
  const depth=5;
  for(let i=depth;i>0;i--){
    ctx.fillStyle=`rgba(0,0,50,${0.03+i/30})`;
    ctx.beginPath();
    ctx.arc(x+i,y+i,radius,0,Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(x,y,radius,0,Math.PI*2);
  ctx.fill();
}

function drawSineLine(offsetX,amplitudeFunc,frequency){
  if(!showSine) return;
  ctx.beginPath();
  ctx.moveTo(0,canvas.height/2);
  for(let x=0;x<=canvas.width;x+=2){
    const amp=amplitudeFunc(x);
    const y=canvas.height/2 + Math.sin((x+offsetX)*frequency)*amp;
    ctx.lineTo(x,y);
  }
  ctx.strokeStyle="rgba(0,200,255,0.4)";
  ctx.lineWidth=2;
  ctx.stroke();
}

function draw(){
  ctx.fillStyle="rgba(0,0,0,0.1)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  t+=1;

  const amplitude = baseAmplitude + Math.sin(t*rhythmSpeed)*50;
  startX += 2;
  if(startX>canvas.width + text.length*baseFontSize) startX=-text.length*baseFontSize;

  const amplitudeFunc = x => amplitude;
  drawSineLine(startX,amplitudeFunc,frequency);

  letters.forEach((l,i)=>{
    l.spacingMultiplier += (Math.random()-0.5)*0.05;
    l.spacingMultiplier = Math.max(0.9,Math.min(1.1,l.spacingMultiplier));

    const x = startX + l.baseOffset*l.spacingMultiplier;
    const y = canvas.height/2 + Math.sin(x*frequency + l.phase)*amplitude;

    const fontSizeNow = baseFontSize + pulseAmount*Math.sin(t*0.05 + l.sizePhase);
    const color = getBlueColor(i,t);

    if(toggleState===1) draw3DCircle(x,y,fontSizeNow/2,color);
    if(toggleState===0){
      const dx=1;
      const dy = Math.sin((x+dx)*frequency + l.phase)*amplitude - Math.sin(x*frequency + l.phase)*amplitude;
      const angle = Math.atan2(dy,dx)*0.3;
      draw3DLetter(l.char,x,y,angle,color,fontSizeNow);
    }

    if(soundOn){
      startAudio();
      const freq = snapToScale(yToFrequency(y));
      letterAudio[i].forEach(o=>{
        o.osc.frequency.value = freq;
        o.osc.type = oscType;
        o.gain.gain.value = 0.005 + 0.01*Math.sin(t*0.01 + i) * (1 + lfoAmount/10);
        o.filter.frequency.value = cutoffValue;
        o.filter.Q.value = resonanceValue;
      });
    } else {
      letterAudio[i].forEach(o=>o.gain.gain.value=0);
    }
  });

  requestAnimationFrame(draw);
}

// Buttons
document.getElementById("toggleButton").addEventListener("click",()=>{toggleState=(toggleState+1)%3; startAudio();});
document.getElementById("toggleSine").addEventListener("click",()=>{showSine=!showSine; startAudio();});
document.getElementById("toggleSound").addEventListener("click",()=>{soundOn=!soundOn; startAudio();});

// Controls
document.getElementById("oscTypeSelect").addEventListener("change",(e)=>{oscType=e.target.value;});
document.getElementById("lfoSlider").addEventListener("input",(e)=>{lfoAmount=parseFloat(e.target.value); document.getElementById("lfoValue").textContent=lfoAmount.toFixed(1);});
document.getElementById("resonanceSlider").addEventListener("input",(e)=>{
  resonanceValue=parseFloat(e.target.value);
  document.getElementById("resonanceValue").textContent=resonanceValue.toFixed(1);
});
document.getElementById("cutoffSlider").addEventListener("input",(e)=>{
  cutoffValue=parseFloat(e.target.value);
  document.getElementById("cutoffValue").textContent=cutoffValue;
});

ctx.font=`${baseFontSize}px Arial`;
draw();