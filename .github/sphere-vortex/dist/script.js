const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const square = { x: canvas.width/2, y: canvas.height/2, size: 610 };
const circles = [];
const colors = ["#FF00FF", "#00FFFF", "#FFFF00", "#FF4500", "#00FF00"];

// Initialize circles
for (let i = 0; i < 1000; i++) {
  circles.push({
    radius: 8,
    angle: i * 0.6,
    speed: 0.2 + i * 0.005,
    orbit: 80 + i * 20,
    color: colors[i % colors.length],
  });
}

function render() {
  // Trail effect
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw center square
  // ctx.fillStyle = "#FFFFFF";
  // ctx.fillRect(square.x - square.size/2, square.y - square.size/2, square.size, square.size);

  // Draw orbiting circles
  circles.forEach(c => {
    c.angle += c.speed;
    const x = square.x + c.orbit * Math.cos(c.angle);
    const y = square.y + c.orbit * Math.sin(c.angle);
    ctx.beginPath();
    ctx.arc(x, y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
  });

  requestAnimationFrame(render);
}

render();

// Make canvas responsive
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  square.x = canvas.width / 2;
  square.y = canvas.height / 2;
});