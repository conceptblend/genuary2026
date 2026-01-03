import * as p5 from "p5";
// import * as utils from "./lib/fx-utils";

/**
 * FIBONACCI SPIRAL VISUALIZATION
 * Creates an animated spiral of Fibonacci rectangles, each filled with a grid of random shapes.
 * The animation cycles through highlighting different rectangles in the sequence.
 */

// PARAMETER SETS - Different visual configurations to choose from
const PARAM_SETS = [
  {
    name: "fibonacci",
    seed: "hello world",
    width: 610,
    height: 987,
    fps: 2,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colours: ["#01befe", "#ffdd00", "#ff006d", "#8f00ff"],
    steps: 15,
    cellsPerSide: 10,
  },
  {
    name: "fibonacci-2",
    seed: "hello world",
    width: 610,
    height: 987,
    fps: 2,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colours: ["#4c72b0", "#55a868", "#c44e52", "#8172b2", "#ccb974", "#64b5cd"],
    steps: 15,
    cellsPerSide: 4,
  },
  {
    name: "fibonacci-3",
    seed: "hello world",
    width: 610,
    height: 987,
    fps: 2,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colours: ["#4c72b0", "#55a868", "#c44e52", "#8172b2", "#ccb974", "#64b5cd"],
    steps: 15,
    cellsPerSide: 2,
  },
  {
    name: "fibonacci-4",
    seed: "hello world",
    width: 610,
    height: 987,
    fps: 4,
    duration: 4 * 4 * 2, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colours: ["#001d3d", "#003566", "#ffc300", "#ffd60a"],
    steps: 15,
    cellsPerSide: 4,
  },
  {
    name: "fibonacci-5",
    seed: "hello world",
    width: 610,
    height: 987,
    fps: 4,
    duration: 4 * 4 * 2, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
    colours: ["#8172b2", "#55a868", "#c44e52", "#ccb974", "#64b5cd", "#4c72b0"],
    steps: 15,
    cellsPerSide: 4,
  },
];

// PARAMETERS IN USE - Selects the active parameter set (second to last in the array)
const PARAMS = PARAM_SETS[PARAM_SETS.length - 2];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION = PARAMS.duration;

P5Capture.setDefaultOptions({
  format: "webm",
  framerate: FPS,
  duration: DURATION,
  verbose: true,
  disableUi: true,
});

/**
 * Fibonacci sequence generator
 * Yields the Fibonacci sequence starting from 1: 1, 1, 2, 3, 5, 8, 13, 21...
 * Uses bigint to handle large numbers without overflow
 */
function* fib(): Generator<bigint, never, unknown> {
  let a: bigint = 0n;
  let b: bigint = 1n;

  // Start sequence at 1 (skip initial 0)
  yield b;

  while (true) {
    const next = a + b;
    yield next;
    a = b;
    b = next;
  }
}

// Visual parameters
const STEPS = PARAMS.steps ?? 15; // Number of Fibonacci rectangles to generate
const COLOURS = PARAMS.colours ?? ["#fff", "#999", "#333"]; // Color palette
const CELLS_PER_SIDE = PARAMS.cellsPerSide ?? 6; // Grid density within each Fibonacci rectangle

// Global colors used by drawing functions (set per-rectangle during animation)
let global_bg, global_fg;

export const sketch = (p: p5) => {
  let isRecording = false;
  let capture;

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.RGB, 255);
    p.ellipseMode(p.CENTER);
    p.rectMode(p.CENTER);

    p.noStroke();
    p.background(255);

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
    p.background(255);

    // Main drawing function - draws all Fibonacci rectangles with animation
    fibonacciTiles(STEPS);

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

  // Keyboard interaction - press 'S' to save current frame as PNG
  p.keyReleased = (e: KeyboardEvent) => {
    if (e.key === "s" || e.key === "S") {
      downloadOutput("png");
    }
  };

  // Placement directions for building the Fibonacci spiral
  enum placementPositions {
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
  }

  // The spiral grows in a counter-clockwise pattern: RIGHT -> TOP -> LEFT -> BOTTOM -> repeat
  const placementSequence = [
    placementPositions.RIGHT,
    placementPositions.TOP,
    placementPositions.LEFT,
    placementPositions.BOTTOM,
  ];

  /**
   * Creates and draws a Fibonacci spiral
   * @param numSteps - Number of Fibonacci rectangles to generate (default: 3)
   *
   * The function:
   * 1. Generates Fibonacci numbers and calculates rectangle positions in a spiral
   * 2. Centers the entire spiral on the canvas
   * 3. Animates by cycling which rectangle is highlighted (different colors)
   * 4. Fills each rectangle with a grid of random shapes
   */
  function fibonacciTiles(numSteps: number = 3) {
    let fibo = fib();
    let lastFib = 0,
      currFib = 0;

    // Position tracking - starts at origin, grows in spiral pattern
    let x = 0,
      y = 0,
      outerHeight = 0,
      outerWidth = 0;

    // Store all rectangle positions and sizes
    const rects = [];
    for (let n = 0; n < numSteps; n++) {
      lastFib = currFib;
      currFib = Number(fibo.next().value);

      // Calculate position for each new rectangle in the spiral
      if (n > 0) {
        let nextPlacement = placementSequence[(n - 1) % placementSequence.length];
        switch (nextPlacement) {
          case placementPositions.RIGHT:
            x += lastFib;
            n == 1 ? (y = y) : (y -= currFib - lastFib);
            outerWidth = currFib + lastFib;
            outerHeight = currFib;
            break;
          case placementPositions.TOP:
            x -= currFib - lastFib;
            y -= currFib;
            outerWidth = currFib;
            outerHeight = currFib + lastFib;
            break;
          case placementPositions.LEFT:
            x -= currFib;
            outerWidth = currFib + lastFib;
            outerHeight = currFib;
            break;
          case placementPositions.BOTTOM:
            y += lastFib;
            outerWidth = currFib;
            outerHeight = currFib + lastFib;
            break;
        }
      }
      rects.push({
        x,
        y,
        size: currFib,
      });
    }

    // Find the top-left corner of the spiral's bounding box
    let minX = Infinity;
    let minY = Infinity;
    rects.forEach((rect) => {
      if (rect.x < minX) minX = rect.x;
      if (rect.y < minY) minY = rect.y;
    });

    // Calculate offset to center the entire spiral on the canvas
    const cx = rects[0].x - minX + (p.width - outerWidth) * 0.5;
    const cy = rects[0].y - minY + (p.height - outerHeight) * 0.5;

    // Draw each rectangle with animation
    // The animation cycles through highlighting one rectangle per frame
    const pal = [...COLOURS];
    rects.forEach((rect, n) => {
      // Check if this rectangle should be highlighted in the current frame
      if (rects.length - n === (p.frameCount - 1) % rects.length) {
        // Highlighted rectangle uses different colors (pal[0] and pal[3])
        global_bg = pal[0];
        global_fg = pal[3];
      } else {
        // Non-highlighted rectangles use standard colors (pal[0] and pal[1])
        global_bg = pal[0];
        global_fg = pal[1];
      }

      // Fill this rectangle with a grid of random shapes
      fillGrid(cx + rect.x, cy + rect.y, rect.size, Math.max(1, rect.size / CELLS_PER_SIDE));
    });
  }
  /**
   * Fills a Fibonacci rectangle with a grid of cells
   * @param ox - Origin x coordinate (top-left corner)
   * @param oy - Origin y coordinate (top-left corner)
   * @param osize - Size of the rectangle
   * @param cellSize - Size of each cell in the grid
   */
  function fillGrid(ox, oy, osize, cellSize) {
    const cells = Math.floor(osize / cellSize);

    // Draw background rectangle
    p.push();
    p.fill(global_bg);
    p.rect(ox + osize * 0.5, oy + osize * 0.5, osize);
    p.pop();

    // Fill grid with random shapes in each cell
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        fillCell(ox + col * cellSize, oy + row * cellSize, cellSize, Math.floor(Math.random() * 3));
      }
    }
  }

  /**
   * Draws a random shape in a single cell
   * @param x - Top-left x coordinate of cell
   * @param y - Top-left y coordinate of cell
   * @param size - Size of the cell
   * @param style - Unused parameter (kept for backwards compatibility)
   *
   * Randomly selects one of 5 shape patterns:
   * 0: Filled circle (default)
   * 1: Simple filled circle
   * 2: Cross pattern (vertical + horizontal rectangles)
   * 3: Vertical line
   * 4: Horizontal line
   */
  function fillCell(x, y, size, style: number = 0) {
    const halfCell = size * 0.5;

    p.fill(global_fg);
    if (size <= 4) {
      // For very small cells, just draw a tiny square
      p.rect(x + halfCell, y + halfCell, 1);
    } else {
      const scale = 0.9;
      switch (Math.floor(Math.random() * 5)) {
        case 1:
          // Filled circle
          p.ellipse(x + halfCell, y + halfCell, size * scale);
          break;
        case 2:
          // Cross pattern
          p.rect(x + halfCell, y + halfCell, size * 0.1, size * scale);
          p.rect(x + halfCell, y + halfCell, size * scale, size * 0.1);
          break;
        case 3:
          // Vertical line
          p.rect(x + halfCell, y + halfCell, size * 0.1, size * scale);
          break;
        case 4:
          // Horizontal line
          p.rect(x + halfCell, y + halfCell, size * scale, size * 0.1);
          break;
        default:
          // Ring (filled circle with smaller circle cut out)
          p.ellipse(x + halfCell, y + halfCell, size * scale);
          p.fill(global_bg);
          p.ellipse(x + halfCell, y + halfCell, size * scale * 0.5);
      }
    }
  }

  /**
   * Generates a unique filename based on parameters and timestamp
   * Format: name-seed-timestamp
   */
  function getName() {
    return `${PARAMS.name}-${encodeURIComponent(PARAMS.seed)}-${new Date().toISOString()}`;
  }

  /**
   * Saves the current canvas as an image file
   */
  function saveImage(ext = "jpg") {
    p.save(`${getName()}.${ext}`);
  }

  /**
   * Saves the current parameter configuration as JSON
   * Useful for reproducing the exact same output later
   */
  function saveConfig() {
    p.saveJSON(PARAMS, `${getName()}-config.json`);
  }

  /**
   * Downloads both the image and config file
   * Called when user presses 'S' key
   */
  function downloadOutput(ext = "jpg") {
    saveImage(PARAMS.renderAsVector ? "svg" : ext);
    saveConfig();
  }
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
