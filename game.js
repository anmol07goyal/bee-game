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

// Bee sprite image from repo: bee4.png
const beeImage = new Image();
beeImage.src = 'bee4.png';

class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // base sprite dimensions (width, height)
    this.baseWidth = 42; // starting visual width
    this.baseHeight = 34; // starting visual height (slightly shorter)
    this.width = this.baseWidth;
    this.height = this.baseHeight;

    this.targetX = x;
    this.targetY = y;

    this.speed = 0.06;

    // rotation to face the target, but never upside down
    this.rotation = 0;
    this.rotationSpeed = 0.18;

    // chonk / growth system
    this.chonk = 0;
    this.maxChonk = 8;
    this.flipped = false;

    // a short visual scale pulse when chonking
    this.pulse = 0;
  }

  draw(time) {
    if (!beeImage.complete) return;

    ctx.save();

    const bobAmp = 6 + this.chonk * 1.8;
    const bob = Math.sin(time / 180) * bobAmp;

    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.rotation);

    // Because the provided sprite is a forward-facing bee, we flip horizontally if needed so it never looks upside down
    if (this.flipped) ctx.scale(-1, 1);

    // Apply a small pulse effect for a satisfying "chonk" pop
    const pulseScale = 1 + this.pulse;
    const drawW = this.width * pulseScale;
    const drawH = this.height * pulseScale;

    ctx.drawImage(beeImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  update(dt) {
    // decay pulse
    this.pulse = Math.max(0, this.pulse - (dt / 5000));

    // Move toward target using lerp
    this.x += (this.targetX - this.x) * this.speed;
    this.y += (this.targetY - this.y) * this.speed;

    const raw = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    let desired = raw;
    while (desired > Math.PI) desired -= Math.PI * 2;
    while (desired < -Math.PI) desired += Math.PI * 2;

    // Keep the bee from appearing upside down by flipping horizontally when needed
    let flip = false;
    if (desired > Math.PI / 2) {
      desired -= Math.PI;
      flip = true;
    } else if (desired < -Math.PI / 2) {
      desired += Math.PI;
      flip = true;
    }

    this.flipped = flip;

    let diff = desired - this.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.rotation += diff * this.rotationSpeed;
  }

  chonkUp() {
    if (this.chonk >= this.maxChonk) return;
    this.chonk += 1;

    // Increase visual width more than height so it looks chonkier, not just larger
    this.width = this.baseWidth + this.chonk * 8; // wider growth
    this.height = this.baseHeight + this.chonk * 4; // modest height growth

    // speed penalty
    this.speed = Math.max(0.01, this.speed - 0.0075);

    // small pulse to show the pop
    this.pulse = 0.12;
  }

  collisionRadius() {
    // use a radius based on the current dimensions
    return Math.max(this.width, this.height) * 0.5;
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

function update(dt) {
  bee.update(dt);

  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    const dx = f.x - bee.x;
    const dy = f.y - bee.y;
    const dist = Math.hypot(dx, dy);
    if (dist < Math.max(18, bee.collisionRadius() * 0.5)) {
      flowers.splice(i, 1);
      bee.chonkUp();
    }
  }
}

function draw(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const f of flowers) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `28px serif`;
    ctx.fillText('🌸', f.x, f.y);
    ctx.restore();
  }

  bee.draw(time);
}
