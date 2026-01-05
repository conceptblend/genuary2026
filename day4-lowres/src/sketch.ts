import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "set one",
    seed: "hello world",
    width: 800,
    height: 1200,
    fps: 2,
    duration: 30 * 5, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: !true,
    isAnimated: true,
    renderAsVector: AS_SVG,
  },
  {
    name: "rick-astley",
    seed: "hello world",
    width: 498,
    height: 428,
    fps: 16,
    duration: 33 * 4, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: true,
    isAnimated: true,
    renderAsVector: AS_SVG,
  },
];

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

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

export const sketch = (p: p5) => {
  let isRecording = false;
  let capture;
  let imgs = [];
  let img;
  let buffer;

  p.preload = () => {
    for (let n = 1; n <= 32; n++) {
      imgs.push(p.loadImage(`./imgs/rick-astley_${n.toString().padStart(4, "0")}.png`));
    }
  };

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.frameRate(FPS);
    p.pixelDensity(1);
    p.angleMode(p.DEGREES);
    p.colorMode(p.RGB, 255);

    p.noStroke();

    // Dependency: Statically added via HTML
    Math.seedrandom(PARAMS.seed);

    // Initialize capture instance if exporting video
    if (EXPORTVIDEO) {
      capture = P5Capture.getInstance();
    }

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();

    buffer = p.createImage(imgs[0].width, imgs[0].height);
  };

  p.draw = () => {
    p.background(0);

    // DO YOUR DRAWING HERE!
    img = imgs[(p.frameCount - 1) % imgs.length];
    img.loadPixels();
    buffer.loadPixels();

    const mod = Math.floor(6 * ((p.sin(90 + p.frameCount * 8) + 1) * 0.5));

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        let sumR = 0,
          sumG = 0,
          sumB = 0;

        const blockSize = Math.pow(2, mod);
        // Calc distance from center
        // const dx = cx - x;
        // const dist = Math.sqrt(dx * dx + dy * dy);
        // const factor = Math.sin((p.frameCount + dist / img.height) * Math.PI) * 0.5 + 1;
        // const blockSize = Math.round(4 * factor);
        // const blockSize = Math.round((0.5 * Math.sin(-dist * 0.0125 + Math.floor(p.frameCount * 0.5)) + 1) * 8);
        // const blockSize = Math.round((0.5 * Math.sin(-dist + p.frameCount) + 1) * 8);
        // const blockSize = Math.max(1, Math.round((0.5 * Math.sin(angle * p.TWO_PI) + 1) * 16));
        // const blockSize = Math.pow(2, Math.round((0.5 * Math.sin(angle * p.TWO_PI) + 1) * 4 - 1));

        let px = x - (x % blockSize) + Math.floor(blockSize * 0.5);
        px = Math.min(img.width - 1, Math.max(0, px));
        let py = y - (y % blockSize) + Math.floor(blockSize * 0.5);
        py = Math.min(img.height - 1, Math.max(0, py));
        const index = (px + py * img.width) * 4;

        sumR += img.pixels[index];
        sumG += img.pixels[index + 1];
        sumB += img.pixels[index + 2];

        const resultIndex = (x + y * img.width) * 4;
        buffer.pixels[resultIndex] = Math.min(sumR, 255);
        buffer.pixels[resultIndex + 1] = Math.min(sumG, 255);
        buffer.pixels[resultIndex + 2] = Math.min(sumB, 255);
        buffer.pixels[resultIndex + 3] = 255;
      }
    }

    buffer.updatePixels();
    // p.image(img, 0, 0);
    p.image(buffer, 0, 0);

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
