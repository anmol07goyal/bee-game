# Bee Game

A tiny HTML5 canvas demo where you control a bee with your clicks: click to spawn flowers (🌸), the bee flies to them, eats them, and grows "chonkier" each time it eats one.

What this repo contains
- index.html — basic HTML5 boilerplate with a full-screen canvas
- style.css — removes default margins and styles the canvas
- game.js — simple game engine, Bee entity, click interaction, and collision/eating mechanic

How to run locally
1. Open `index.html` directly in a modern browser.

Or serve with a simple HTTP server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Controls / mechanics
- Click anywhere on the canvas to spawn a flower and send the bee to it.
- When the bee reaches a flower (within ~20px), it "eats" it: the flower disappears, the bee grows (size +10) and becomes slightly slower.

Notes
- The bee is rendered using an emoji and bobs up and down using a sine wave.
- This is a minimal demo intended as a fun starting point to extend — try adding score, sound, or more bee behaviors.
