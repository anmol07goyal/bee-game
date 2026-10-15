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

// Images from repo (moved into images/ folder)
const bgImage = new Image();
bgImage.src = 'images/garden.png';
const beeImage = new Image();
beeImage.src = 'images/bee4.png';
const bloodImage = new Image();
bloodImage.src = 'images/blood.png';

// Flower emoji pool (randomized per spawn)
const flowerPool = ['🌸','🌺','🌼','🌷','🌻','💮','💐','🪷'];

// Game state for burst / restart
let isBurst = false;
let burstStart = 0;
let restartTimeout = null;

class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // Balanced starting size for the bee (not too big, not too small)
    this.baseWidth = 56;
    this.baseHeight = 44;
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
    if (isBurst) return;
    if (!beeImage.complete) return;

    ctx.save();

    const bobAmp = 6 + this.chonk * 1.8;
    const bob = Math.sin(time / 180) * bobAmp;

    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.rotation);

    if (this.flipped) ctx.scale(-1, 1);

    const pulseScale = 1 + this.pulse;
    const drawW = this.width * pulseScale;
    const drawH = this.height * pulseScale;

    ctx.drawImage(beeImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  update(dt) {
    if (isBurst) return;

    this.pulse = Math.max(0, this.pulse - (dt / 1400));

    this.x += (this.targetX - this.x) * this.speed;
    this.y += (this.targetY - this.y) * this.speed;

    const raw = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    let desired = raw;
    while (desired > Math.PI) desired -= Math.PI * 2;
    while (desired < -Math.PI) desired += Math.PI * 2;

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

    this.width = this.baseWidth + this.chonk * 10;
    this.height = this.baseHeight + this.chonk * 5;

    this.speed = Math.max(0.01, this.speed - 0.0075);
    this.pulse = 0.14;
  }

  collisionRadius() {
    return Math.max(this.width, this.height) * 0.45;
  }
}

const flowers = [];

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const distToBee = Math.hypot(mx - bee.x, my - bee.y);
  const canBurst = (bee.chonk >= bee.maxChonk - 1) || (bee.speed <= 0.02);
  if (!isBurst && canBurst && distToBee < bee.collisionRadius() * 0.9) {
    triggerBurst();
    return;
  }

  const emoji = flowerPool[Math.floor(Math.random() * flowerPool.length)];
  const size = 22 + Math.floor(Math.random() * 18);

  flowers.push({ x: mx, y: my, icon: emoji, size });
  bee.targetX = mx;
  bee.targetY = my;
});

function triggerBurst() {
  isBurst = true;
  burstStart = performance.now();

  if (restartTimeout) clearTimeout(restartTimeout);
  restartTimeout = setTimeout(resetGame, 5000);
}

function resetGame() {
  flowers.length = 0;
  bee = new Bee(canvas.width / 2, canvas.height / 2);
  isBurst = false;
  burstStart = 0;
  restartTimeout = null;
}

let bee = new Bee(canvas.width / 2, canvas.height / 2);

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
  if (bgImage.complete) {
    try {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  for (const f of flowers) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${f.size}px serif`;
    ctx.fillText(f.icon, f.x, f.y);
    ctx.restore();
  }

  if (isBurst) {
    if (bloodImage.complete) {
      const size = Math.max(48, bee.width * 1.2);
      ctx.save();
      ctx.translate(bee.x, bee.y);
      ctx.drawImage(bloodImage, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    const msg = 'Oops, you killed it.';
    ctx.save();
    ctx.font = '36px "Bungee", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    ctx.restore();

    return;
  }

  bee.draw(time);
}
