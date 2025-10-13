const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

const baseFontSize = 20, pulseAmount=5, minAmplitude=40;
let maxAmplitude = canvas.height/2-20;
const minFrequency=0.01,maxFrequency=0.05,rhythmSpeed=0.002,spacingVarianceSpeed=0.05,letterRotationFactor=0.3;

let text = "Interactive Waveform Text", toggleState=0, showSine=true, soundOn=false;
let t=0, horizontalRange=canvas.width/2, horizontalSpeed=0.002;
let letters=[];

function buildLetters(newText){
  letters = newText.split("").map((char,i)=>({char, baseOffset:i*baseFontSize*0.6, spacingMultiplier:1+Math.random()*0.1, sizePhase:Math.random()*Math.PI*2}));
}
buildLetters(text);

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioStarted=false, oscType="triangle", lfoAmount=0, resonanceValue=1, cutoffValue=1000;
const numOscPerLetter=3;
let letterAudio=[];

function buildAudio(){
  letterAudio.forEach(arr=>arr.forEach(o=>o.osc.stop?.()));
  letterAudio = letters.map(()=>{ 
    const oscillators=[];
    for(let i=0;i<numOscPerLetter;i++){
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const filter=audioCtx.createBiquadFilter();
      filter.type="lowpass"; filter.frequency.value=cutoffValue; filter.Q.value=resonanceValue;
      osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
      osc.type=oscType; gain.gain.value=0;
      oscillators.push({osc,gain,filter});
    }
    return oscillators;
  });
}
buildAudio();

function startAudio(){
  if(!audioStarted){
    audioCtx.resume().then(()=>{
      letterAudio.forEach(arr=>arr.forEach(o=>{
        try{o.osc.start();}catch(e){}
        o.gain.gain.value = 0.005; // activate sound
      }));
      audioStarted=true;
    });
  }
}

// waveform function for visual wave
function waveform(value,type){
  switch(type){
    case "sine": return Math.sin(value);
    case "triangle": return 2*Math.abs(2*((value/(2*Math.PI))%1)-1)-1;
    case "square": return Math.sign(Math.sin(value));
    case "sawtooth": return 2*((value/(2*Math.PI))%1)-1;
    default: return Math.sin(value);
  }
}

function getBlueColor(index,time){ return `hsl(210,100%,${50+20*Math.sin(time*0.05+index)}%)`; }

function draw3DLetter(char,x,y,angle,color,fontSize){
  const depth=5;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font=`${fontSize}px Arial`;
  for(let i=depth;i>0;i--){ ctx.fillStyle=`rgba(0,0,50,${0.03+i/30})`; ctx.fillText(char,i,i); }
  ctx.fillStyle=color; ctx.fillText(char,0,0); ctx.restore();
}

function draw3DCircle(x,y,radius,color){
  const depth=5;
  for(let i=depth;i>0;i--){ ctx.fillStyle=`rgba(0,0,50,${0.03+i/30})`; ctx.beginPath(); ctx.arc(x+i,y+i,radius,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill();
}

function drawSineLine(offsetX, amplitudeFunc, frequency){
  if(!showSine) return;
  ctx.beginPath(); ctx.moveTo(0,canvas.height/2);
  for(let x=0;x<=canvas.width;x+=2){
    const phase=(x+offsetX)*frequency*2*Math.PI;
    const y=canvas.height/2 + waveform(phase, oscType)*amplitudeFunc(x);
    ctx.lineTo(x,y);
  }
  ctx.strokeStyle="rgba(0,200,255,0.4)"; ctx.lineWidth=2; ctx.stroke();
}

function draw(){
  ctx.fillStyle="rgba(0,0,0,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height);
  t+=1;
  const amplitudeBase=minAmplitude+(maxAmplitude-minAmplitude)*(0.5+0.5*Math.sin(t*rhythmSpeed));
  const frequency=minFrequency+(maxFrequency-minFrequency)*(0.5+0.5*Math.cos(t*rhythmSpeed));
  const offsetX=horizontalRange*Math.sin(t*horizontalSpeed*Math.PI*2);

  const amplitudeFunc=(x,i)=>{
    let baseAmp = amplitudeBase*(i%2===0?1:0.5)*(0.5+0.5*Math.sin(x*0.02+t*rhythmSpeed*5));
    baseAmp *= 0.5+resonanceValue/20;
    return baseAmp;
  };

  drawSineLine(offsetX, amplitudeFunc, frequency);

  letters.forEach((l,i)=>{
    l.spacingMultiplier += (Math.random()-0.5)*spacingVarianceSpeed;
    l.spacingMultiplier=Math.max(0.9,Math.min(1.1,l.spacingMultiplier));
    const x = offsetX + canvas.width/2 + l.baseOffset*l.spacingMultiplier;
    const amp = amplitudeFunc(x,i);
    const phase = x*frequency*2*Math.PI;
    const y = canvas.height/2 + waveform(phase, oscType)*amp;

    const fontSizeNow=baseFontSize+pulseAmount*Math.sin(t*0.05+l.sizePhase);
    const color = getBlueColor(i,t);

    if(toggleState===1) draw3DCircle(x,y,fontSizeNow/2,color);
    if(toggleState===0){
      const dx=1;
      const dy=waveform((x+dx)*frequency*2*Math.PI,oscType)*amp - waveform(phase,oscType)*amp;
      const angle=Math.atan2(dy,dx)*letterRotationFactor;
      draw3DLetter(l.char,x,y,angle,color,fontSizeNow);
    }

    if(soundOn){
      startAudio();
      const freq=220+(y/canvas.height)*660;
      letterAudio[i].forEach(o=>{
        o.osc.frequency.value=freq;
        o.osc.type=oscType;
        o.gain.gain.value = 0.005 + 0.01*Math.sin(t*0.01+i)*(1+lfoAmount/10);
        o.filter.frequency.value=cutoffValue;
        o.filter.Q.value=resonanceValue;
      });
    } else {
      letterAudio[i].forEach(o=>o.gain.gain.value=0);
    }
  });

  requestAnimationFrame(draw);
}

// --------------------
// UI controls
// --------------------
document.getElementById("toggleButton").addEventListener("click",()=>{toggleState=(toggleState+1)%3;});
document.getElementById("oscTypeSelect").addEventListener("change",(e)=>{oscType=e.target.value;});
document.getElementById("lfoSlider").addEventListener("input",(e)=>{lfoAmount=parseFloat(e.target.value);document.getElementById("lfoValue").textContent=lfoAmount.toFixed(1);});
document.getElementById("resonanceSlider").addEventListener("input",(e)=>{resonanceValue=parseFloat(e.target.value);document.getElementById("resonanceValue").textContent=resonanceValue.toFixed(1);});
document.getElementById("cutoffSlider").addEventListener("input",(e)=>{cutoffValue=parseFloat(e.target.value);document.getElementById("cutoffValue").textContent=cutoffValue;});
document.getElementById("amplitudeSlider").addEventListener("input",(e)=>{const val=parseFloat(e.target.value); maxAmplitude=val; document.getElementById("amplitudeValue").textContent=val;});

// Panel toggle
const controlPanel=document.getElementById("controlPanel");
document.getElementById("panelToggleBtn").addEventListener("click",()=>{controlPanel.classList.toggle("hidden");controlPanel.classList.toggle("visible");});

// Sound toggle button
const soundToggleBtn=document.getElementById("soundToggleBtn");
soundToggleBtn.addEventListener("click",()=>{
  soundOn=!soundOn; startAudio();
  soundToggleBtn.textContent = soundOn?"🔊":"🔇";
});

// Text input
const textInput=document.getElementById("textInput");
const applyTextBtn=document.getElementById("applyTextBtn");
textInput.value=text;
applyTextBtn.addEventListener("click",()=>{
  text=textInput.value||" ";
  buildLetters(text);
  buildAudio();
  if(soundOn) startAudio();
});

draw();