You are a senior front-end animation engineer.

Your task is to build a HIGH-END animated splash screen for a website using a provided logo image.

The goal is to create a smooth, premium loading animation similar to Apple's product intros.

The logo file is:

logo.png

The logo is:
- white
- transparent background
- PNG format
- very high resolution (10k x 10k)
- should cache it 

The animation must use the logo as a MASK so animation only appears inside the logo shape.

Do NOT fake the fill using rectangles. 
You MUST use SVG masking or clipPath.

-------------------------------------

PROJECT STRUCTURE

Return clean code using this structure:

index.html
style.css
script.js

Do NOT inline everything unless necessary.

-------------------------------------

SPLASH SCREEN DESIGN

Create a FULLSCREEN splash screen.

Properties:

Background: pure black (#000)
Logo centered vertically and horizontally
Logo size: between 160px – 220px width
Everything should feel modern and minimal.

Layout structure:

body
  splash-screen
    logo-container
      svg-mask
      wave-animation
  main-content (landing page)

-------------------------------------

ANIMATION TIMELINE
The logo outline should be visible instantly when the page loads. It should be white and thick.
The animation sequence must follow this EXACT timeline.

During this step:
Logo interior remains transparent.

-------------------------------------

STEP 1 — Liquid Fill Animation

After 2 seconds upon page loads:

Begin a liquid fill animation INSIDE the logo.

Requirements:

The liquid must:
- start at bottom of logo
- rise upward gradually
- include animated waves
- look organic
- feel fluid and natural

Implementation rules:

Use an SVG wave path.

Animate wave horizontally using:
translateX or path animation.

The water level must rise smoothly.

Duration:
4 seconds.

The wave must:
- move horizontally
- gently oscillate
- feel like real water.

IMPORTANT:

The liquid MUST be clipped by the logo mask.

Meaning:
The water should only appear INSIDE the logo.

Use:
SVG mask or clipPath referencing logo shape.

-------------------------------------

STEP 2 — Glow Effect

Once the logo becomes fully filled:

Add a subtle glow.

Implementation:

CSS glow using:

filter: drop-shadow

Glow should:
- pulse once or twice
- be soft
- feel premium.
- just one glow animation

Duration:
~1 second.

-------------------------------------

STEP 3 — Transition

After the glow animation:

Fade out the splash screen smoothly like everything turns white.

Simultaneously fade in the landing page.

Transition duration:
~800ms.

-------------------------------------

LANDING PAGE

After splash screen completes, reveal a simple landing page.

Design style:

Minimal
Modern
Clean
Professional

Color palette:

Primary:
black
white

Accent:
navy blue
orange

Landing page layout:

Navbar
Hero section
Call-to-action button

Use lots of whitespace.

-------------------------------------

RESPONSIVENESS

The layout must work on:

Desktop
Tablet
Mobile

Logo should scale proportionally.

-------------------------------------

TECHNICAL REQUIREMENTS

Use:

HTML
CSS
JavaScript
SVG masking or clipPath
SVG animated wave

Animation should run automatically on page load.

Avoid heavy frameworks.

Do NOT use external animation libraries.

Use pure CSS / SVG / JS.

-------------------------------------

CODE QUALITY

Return:

1. clean HTML
2. organized CSS
3. structured JavaScript
4. comments explaining each animation step

Make the code production quality.

-------------------------------------

IMPORTANT VISUAL GOAL

The final animation should feel:

premium
smooth
modern
fluid

The liquid fill must look like REAL WATER inside the logo.

-------------------------------------

Assume the logo file path is:

logo.png