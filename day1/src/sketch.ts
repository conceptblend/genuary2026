import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "day1-one-color-one-shape",
    seed: "hello world",
    width: 540,
    height: 720,
    fps: 30,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: false,
    renderAsVector: AS_SVG,
    plottingRadiusScaleFactor: 1.75,
    circumferenceSteps: 12,
    concentricRings: 2,
  },
  {
    name: "day1-one-color-one-shape",
    seed: "hello world",
    width: 540,
    height: 720,
    fps: 30,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: false,
    renderAsVector: AS_SVG,
    plottingRadiusScaleFactor: 1.5,
    circumferenceSteps: 8,
    concentricRings: 1,
    overlapFactor: 1.7, // 0 < n < infinity [12]
  },
  {
    name: "day1-one-color-one-shape-motion-pentagon",
    seed: "hello world",
    width: 540,
    height: 960,
    fps: 30,
    duration: 720, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    plottingRadiusScaleFactor: 1.8,
    circumferenceSteps: 10,
    concentricRings: 1,
    overlapFactor: 1.0, // 0 < n < infinity [12]
    polygonSideCount: 5,
  },
  {
    name: "day1-one-color-one-shape-motion-hexagon",
    seed: "hello world",
    width: 540,
    height: 960,
    fps: 30,
    duration: 720, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    plottingRadiusScaleFactor: 1.8,
    circumferenceSteps: 10,
    concentricRings: 1,
    overlapFactor: 1.0, // 0 < n < infinity [12]
    polygonSideCount: 6,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION = PARAMS.duration;

P5Capture.setDefaultOptions({
  format: "mp4",
  framerate: FPS,
  duration: DURATION,
  verbose: true,
  disableUi: true,
});

export const sketch = (p: p5) => {
  let isRecording = false;
  let capture;

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.RADIANS);
    p.colorMode(p.RGB, 255);

    p.noStroke();

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);

    p.frameRate(FPS);

    // Initialize capture instance if exporting video
    if (EXPORTVIDEO) {
      capture = P5Capture.getInstance();
    }

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  p.draw = () => {
    // Reset canvas to black background each frame
    p.background(0);

    // Set up drawing style: white outlines, no fill
    p.noFill();
    p.stroke(255);
    p.strokeWeight(5);

    // Animation time: cycles from 0 to 1 over 720 frames (slowed by 0.5x)
    const clampedFrame = ((0.5 * p.frameCount) % 360) / 360;

    // Canvas center point where the pattern radiates from
    const cx = p.width * 0.5;
    const cy = p.height * 0.5;

    // Maximum radius we can draw without going off canvas
    const availableRadius = Math.min(cx, cy);

    // Controls how much polygons overlap (1.0 = touching, >1.0 = overlapping)
    const overlapFactor = PARAMS.overlapFactor ?? 1.0;

    // Start with a small radius and grow it outward in concentric rings
    let plottingRadius = availableRadius * 0.2;
    let oldSideLength = 0;

    // Number of polygons to place around each ring
    const steps = PARAMS.circumferenceSteps;

    // Loop creates concentric rings from center outward until we reach the edge
    while (plottingRadius < availableRadius) {
      // Scale up the radius for the next ring
      plottingRadius *= PARAMS.plottingRadiusScaleFactor;

      // Calculate polygon side length based on ring radius and number of shapes
      // Formula: chord length = 2 * R * sin(π/n) where n is number of points
      const sideLength = 2 * plottingRadius * Math.sin(Math.PI / steps);

      // Place polygons evenly around the current ring
      for (let step = 0; step < steps; step++) {
        // Calculate angle for this polygon's position around the circle
        const angle = (step / steps) * p.TWO_PI;

        // Horizontal offset: rotates around circle in sync with animation
        const dx = Math.cos(angle + clampedFrame * p.TWO_PI + Math.PI) * plottingRadius;

        // Vertical offset: uses smoothstep for eased motion
        // Convert cos wave (-1 to 1) to smoothstep (0 to 1) and back to (-1 to 1)
        const t = (Math.cos(clampedFrame * p.TWO_PI) + 1) / 2; // normalize to 0-1
        const smoothed = t * t * (3 - 2 * t); // smoothstep formula
        const smoothCos = smoothed * 2 - 1; // back to -1 to 1
        const dy = Math.sin(angle + Math.pow(smoothCos, 2) * p.TWO_PI) * plottingRadius;

        // Calculate final position by adding offsets to center point
        const nx = cx + dx;
        const ny = cy + dy;

        // Rotate each polygon to point toward/away from center
        const animationAngle = Math.atan2(dy, dx);

        // Draw the polygon with animated pulsing size (1.0 to 1.25x)
        drawPolygon(
          nx,
          ny,
          sideLength * overlapFactor * p.lerp(1.0, 1.25, Math.sin(clampedFrame * p.TWO_PI)),
          PARAMS.polygonSideCount,
          animationAngle
        );
      }
      oldSideLength = sideLength;
    }

    if (EXPORTVIDEO) {
      if (PARAMS.renderAsVector) throw new Error("Cannot export video when rendering as Vector");

      if (!isRecording) {
        isRecording = true;
        capture.start({
          baseFilename: () => getName(),
        });
        console.log(`Recording ${DURATION} frames at ${FPS} fps...`);
      }

      // Check if recording is complete
      if (p.frameCount >= DURATION) {
        capture.stop(); // This will trigger encoding and download
        p.noLoop();
        saveConfig();
        console.log("Recording complete. Encoding and downloading...");
      }
    }
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (e.key === "s" || e.key === "S") {
      downloadOutput("png");
    }
  };

  function drawShape(x: number, y: number, size: number) {
    const concentricRings = PARAMS.concentricRings;
    for (let i = 0; i < concentricRings; i++) {
      p.ellipse(x, y, size * Math.pow(0.8, i));
    }
  }
  function drawPolygon(x: number, y: number, size: number, sides: number = 5, offsetAngle: number = 0) {
    const concentricRings = PARAMS.concentricRings;
    for (let i = 0; i < concentricRings; i++) {
      const shapeRadius = size * 0.5 * Math.pow(0.8, i);
      const baseAngle = p.TWO_PI / sides;

      p.beginShape();
      for (let v = 0; v < sides; v++) {
        const angle = baseAngle * v + offsetAngle;
        const xDelta = Math.cos(angle) * shapeRadius;
        const yDelta = Math.sin(angle) * shapeRadius;
        p.vertex(x + xDelta, y + yDelta);
      }
      p.endShape(p.CLOSE);
    }
  }

  function getName() {
    // Encode the parameters into the filename
    return `${PARAMS.name}-${encodeURIComponent(PARAMS.seed)}-${new Date().toISOString()}`;
  }

  function saveImage(ext = "jpg") {
    p.save(`${getName()}.${ext}`);
  }

  function saveConfig() {
    p.saveJSON(PARAMS, `${getName()}-config.json`);
  }

  function downloadOutput(ext = "jpg") {
    saveImage(PARAMS.renderAsVector ? "svg" : ext);
    saveConfig();
  }
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
