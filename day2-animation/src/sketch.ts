import * as p5 from "p5";
import * as utils from "./lib/fx-utils";
import "./lib/easing";
import easingsFunctions from "./lib/easing";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "day2-animation-principles",
    seed: "v1",
    width: 540,
    height: 540,
    fps: 30,
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;

const offsetAngle = Math.PI * 0.5;
const arcLength = Math.PI * 0.625;

const frameCountBase = 2 * FPS;
const lagFactor = 2;
const itemCount = 7;
const DURATION = (frameCountBase + lagFactor * itemCount) * 2; /* loops */

P5Capture.setDefaultOptions({
  format: "webm",
  framerate: FPS,
  duration: DURATION,
  verbose: true,
  disableUi: true,
});

const colours = [
  [0, 129, 167], // deep blue
  [0, 175, 185], // light blue
  [254, 217, 183], // peach
  [240, 113, 103], // cherry
];

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
    p.background(253, 252, 220);
    // p.background(0, 0, 0, 128);
    // p.background(0, 0, 0);

    // DO YOUR DRAWING HERE!
    p.stroke(255, 0, 255);
    p.strokeWeight(10);
    p.strokeCap(p.SQUARE);
    p.noFill();

    const cx = p.width * 0.5;
    const cy = p.height * 0.5;

    for (let n = 0; n < itemCount; n++) {
      const radius = (0.3 + n * 0.1) * p.width;
      const lag = n * lagFactor;
      const frame = p.frameCount % (frameCountBase + lagFactor * itemCount);
      const timing = (Math.min(frameCountBase, Math.max(frame - lag, 0)) % frameCountBase) / frameCountBase;

      const easing = easingsFunctions.easeInOutBack(timing) * p.TWO_PI + offsetAngle;
      const startAngle = easing - arcLength * 0.5;
      const endAngle = easing + arcLength * 0.5;

      p.stroke(colours[n % 2]);
      p.arc(cx, cy, radius, radius, startAngle, endAngle, p.OPEN);
      p.stroke(colours[(n % 2) + 2]);
      p.arc(cx, cy, radius, radius, startAngle + Math.PI, endAngle + Math.PI, p.OPEN);
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
