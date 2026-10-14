// Setup HTML5 canvas with id 'gameCanvas' to fill window.innerWidth and window.innerHeight. Create a standard game loop function using requestAnimationFrame that clears the canvas every frame.

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

// Create a Bee class with x, y, size (default 30), targetX, targetY, and speed properties. Add a draw() method that renders a '🐝' emoji using ctx.fillText. Add an update() method that moves x and y towards targetX and targetY using linear interpolation (lerp). Add a Math.sin wave to the y-axis in the draw method so the bee bobs up and down while flying.

class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.targetX = x;
    this.targetY = y;
    this.speed = 0.06; // lerp factor for position

    // rotation properties so the bee faces the target
    this.rotation = 0; // current angle in radians
    this.rotationSpeed = 0.2; // how quickly the bee turns (0..1)
  }

  draw(time) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${this.size}px serif`;

    // bobbing using sine wave
    const bob = Math.sin(time / 200) * Math.min(12, this.size / 3);

    // translate to bee position (including bobbing), rotate so the head points to target, then draw at 0,0
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.rotation);
    ctx.fillText('🐝', 0, 0);
    ctx.restore();
  }

  update() {
    // simple linear interpolation towards target (lerp)
    this.x += (this.targetX - this.x) * this.speed;
    this.y += (this.targetY - this.y) * this.speed;

    // compute desired angle and smoothly rotate towards it
    const desired = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    // normalize angle difference to [-PI, PI]
    let diff = desired - this.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.rotation += diff * this.rotationSpeed;
  }
}

// Create an empty 'flowers' array. Add a click event listener to the canvas. On click, push an object with the mouse x and y coordinates to the flowers array, and set the Bee's targetX and targetY to these coordinates. In the game loop, iterate through the flowers array and draw a '🌸' emoji at their locations.

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

// Calculate the distance between the Bee and its target flower. If the distance is less than 20 pixels, remove that flower from the array. Increase the Bee's size by 10, and decrease its speed property slightly to make it slower and heavier.

function update(dt) {
  bee.update();

  // Check collisions with flowers (nearest-first)
  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    const dx = f.x - bee.x;
    const dy = f.y - bee.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) {
      // "Eat" the flower
      flowers.splice(i, 1);
      bee.size += 10;
      // Make bee slightly slower (heavier), but clamp to a minimum speed
      bee.speed = Math.max(0.01, bee.speed - 0.005);
    }
  }
}

function draw(time) {
  // clear canvas
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

  // draw bee
  bee.draw(time);
}
