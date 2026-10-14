// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTime = 0;
function loop(time = 0) {
  const dt = time - lastTime;
  lastTime = time;

  update(dt);
  draw(time);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Cute Bee drawn on canvas (not an emoji). Bee grows "chonkier" visually by expanding its body radii
class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // base body radii (horizontal, vertical)
    this.baseRx = 22;
    this.baseRy = 14;
    this.rx = this.baseRx; // current horizontal radius (grows when chonking)
    this.ry = this.baseRy; // current vertical radius

    this.targetX = x;
    this.targetY = y;

    this.speed = 0.06; // lerp factor for position

    // rotation so bee faces target
    this.rotation = 0;
    this.rotationSpeed = 0.18; // how quickly the bee turns (0..1)

    // how "chonk" the bee is (affects radii and speed)
    this.chonk = 0;
    this.maxChonk = 6; // visual cap
  }

  draw(time) {
    ctx.save();

    // bobbing using sine wave, amplitude scales a bit with chonk
    const bobAmp = 6 + this.chonk * 2;
    const bob = Math.sin(time / 180) * bobAmp;

    // draw at center then rotate so facing target
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.rotation);

    // Draw wings (behind the body)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(-this.rx * 0.25, -this.ry * 1.2, this.rx * 0.6, this.ry * 0.8, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-this.rx * 0.25, -this.ry * 1.2, this.rx * 0.6, this.ry * 0.8, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Body
    // Yellow base
    ctx.fillStyle = '#FFD042';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.rx, this.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripes (three black stripes)
    ctx.fillStyle = '#111';
    const stripeCount = 3;
    for (let i = 0; i < stripeCount; i++) {
      const t = (i - 1) * (this.rx * 0.35);
      ctx.beginPath();
      // draw a slightly rotated stripe as an ellipse clipped to body
      ctx.save();
      ctx.translate(t, 0);
      ctx.rotate(0.18 * Math.sin(i + time / 500));
      ctx.fillRect(-this.rx * 0.6, -this.ry * 0.6, this.rx * 1.2, this.ry * 1.2);
      ctx.restore();
    }

    // Face / front details: eye and a little smile
    // Eye (positioned towards the right/front)
    const eyeX = this.rx * 0.45;
    const eyeY = -this.ry * 0.18;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, Math.max(1.6, this.ry * 0.22), Math.max(1.6, this.ry * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiny white sparkle on eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX - this.rx * 0.045, eyeY - this.ry * 0.045, Math.max(0.8, this.ry * 0.06), 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(1, this.ry * 0.08);
    ctx.beginPath();
    ctx.moveTo(this.rx * 0.15, -this.ry * 0.6);
    ctx.quadraticCurveTo(this.rx * 0.6, -this.ry * 1.1, this.rx * 0.95, -this.ry * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.rx * 0.15, -this.ry * 0.6);
    ctx.quadraticCurveTo(this.rx * 0.35, -this.ry * 1.0, this.rx * 0.05, -this.ry * 1.5);
    ctx.stroke();

    // Outline for a cute crisp look
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.rx, this.ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  update() {
    // Move toward target using lerp
    this.x += (this.targetX - this.x) * this.speed;
    this.y += (this.targetY - this.y) * this.speed;

    // Desired angle to face the target
    const desired = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    // normalize angle difference to [-PI, PI]
    let diff = desired - this.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    // Smoothly rotate
    this.rotation += diff * this.rotationSpeed;
  }

  // Grow visually when eating
  chonkUp() {
    if (this.chonk >= this.maxChonk) return;
    this.chonk += 1;
    // expand radii a bit
    this.rx = this.baseRx + this.chonk * 6; // wider
    this.ry = this.baseRy + this.chonk * 3; // slightly taller
    // slow down a little
    this.speed = Math.max(0.01, this.speed - 0.0075);
  }

  // helper for collision threshold (scale with size)
  collisionRadius() {
    return (this.rx + this.ry) * 0.6; // heuristic
  }
}

// Flowers array and click handling
const flowers = [];

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  flowers.push({ x: mx, y: my });
  bee.targetX = mx;
  bee.targetY = my;
});

// Initialize bee in the center
const bee = new Bee(canvas.width / 2, canvas.height / 2);

// Update & draw
function update(dt) {
  bee.update();

  // collisions: if bee close to any flower, eat it and chonk up
  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    const dx = f.x - bee.x;
    const dy = f.y - bee.y;
    const dist = Math.hypot(dx, dy);
    if (dist < Math.max(18, bee.collisionRadius() * 0.35)) {
      flowers.splice(i, 1);
      bee.chonkUp();
    }
  }
}

function draw(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw flowers
  for (const f of flowers) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `28px serif`;
    ctx.fillText('🌸', f.x, f.y);
    ctx.restore();
  }

  // draw bee (passes time for bobbing)
  bee.draw(time);
}
