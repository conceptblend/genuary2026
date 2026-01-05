import * as p5 from "p5";
import * as utils from "./lib/fx-utils";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "day4-glitch",
    seed: "hello world",
    width: 800,
    height: 1200,
    fps: 8,
    duration: 64, // no unit (frameCount by default; sometimes seconds or frames or whatever)
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

// 3x3 Gaussian gaussianKernel
// Total sum is 16, so each element is x/16
const gaussianKernel = [
  [1 / 16, 2 / 16, 1 / 16],
  [2 / 16, 4 / 16, 2 / 16],
  [1 / 16, 2 / 16, 1 / 16],
];

export const sketch = (p: p5) => {
  let isRecording = false;
  let capture;
  let img;
  let buffer;

  p.preload = () => {
    img = p.loadImage("./imgs/prepped-rilla-paris-wfyks-9ZiFQ-unsplash.png");
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

    buffer = p.createImage(img.width, img.height);
  };

  p.draw = () => {
    p.background(0);

    // DO YOUR DRAWING HERE!
    img.loadPixels();
    buffer.loadPixels();
    const cx = img.width * 0.5;
    const cy = img.height * 0.5;
    for (let y = 1; y < img.height - 1; y++) {
      for (let x = 1; x < img.width - 1; x++) {
        let sumR = 0,
          sumG = 0,
          sumB = 0;

        // Calc distance from center
        // const dx = cx - x;
        const dy = cy - y;
        // const dist = Math.sqrt(dx * dx + dy * dy);
        // const blockSize = Math.round((0.5 * Math.sin(-dist * 0.0125 + Math.floor(p.frameCount * 0.5)) + 1) * 8);
        // const blockSize = Math.round((0.5 * Math.sin(-dist + p.frameCount) + 1) * 8);
        const blockSize = Math.round((0.5 * Math.sin((y + p.frameCount) * 0.0625) + 1) * 16);

        const px = x; // - (x % blockSize);
        const py = y - (y % blockSize);
        const baseIndex = Math.max(0, px) + Math.max(0, py) * img.width;
        const index = baseIndex * 4;

        sumR += img.pixels[index];
        sumG += img.pixels[index + 1];
        sumB += img.pixels[index + 2];

        // for (let ky = -1; ky <= 1; ky++) {
        //   for (let kx = -1; kx <= 1; kx++) {
        //     const px = x - (x % blockSize);
        //     const py = y - (y % blockSize);
        //     const baseIndex = Math.max(1, px) + kx + Math.max(1, py) * img.width;
        //     const index = baseIndex * 4;
        //     const weight = gaussianKernel[ky + 1][kx + 1];

        //     sumR += img.pixels[index] * weight;
        //     sumG += img.pixels[index + 1] * weight;
        //     sumB += img.pixels[index + 2] * weight;
        //   }
        // }
        // for (let ky = -1; ky <= 1; ky++) {
        //   for (let kx = -1; kx <= 1; kx++) {
        //     const index = (x + kx + (y + ky) * img.width) * 4;
        //     const weight = gaussianKernel[ky + 1][kx + 1];

        //     sumR += img.pixels[index] * weight;
        //     sumG += img.pixels[index + 1] * weight;
        //     sumB += img.pixels[index + 2] * weight;
        //   }
        // }

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
