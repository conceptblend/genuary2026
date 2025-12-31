import * as p5 from "p5";
import * as utils from "./lib/fx-utils";
import { SeedList } from "./lib/SeedList";

// PARAMETER SETS
const PARAM_SETS = [
  {
    name: "lines-and-such",
    seed: "make the lines",
    width: 540,
    height: 540,
    fps: 30,
    duration: 30 * 10, // no unit (frameCount by default; sometimes seconds or frames or whatever)
    exportVideo: false,
    isAnimated: false,
    renderAsVector: AS_SVG,
  },
];
const seedList = new SeedList();

// PARAMETERS IN USE
const PARAMS = PARAM_SETS[PARAM_SETS.length - 1];

// VIDEO
const EXPORTVIDEO = AS_SVG ? false : PARAMS.exportVideo ?? false; // set to `false` to not export
const FPS = PARAMS.fps;
const DURATION = PARAMS.duration;

// const colours = [
//   [178, 31, 82],
//   // [240, 192, 89],
//   // [242, 164, 85],
//   [240, 107, 55],
//   [73, 96, 130],
// ];
const colours = ["#fbf5ef", "#f2d3ab", "#c69fa5", "#8b6d9c", "#494d7e"];

function resetDrawingWithSeed(newSeed) {
  // Dependency: Math.seedrandom is added late via HTML
  Math.seedrandom(newSeed);
  // And, since it seems to recreate the Math.random function, I guess we need to refresh
  utils.refreshRandomFn();
}
export const sketch = (p: p5) => {
  let isRecording = false;

  p.setup = () => {
    // SVG output is MUCH SLOWER but necessary for the SVG exports
    p.createCanvas(PARAMS.width, PARAMS.height, PARAMS.renderAsVector ? p.SVG : p.P2D);

    p.angleMode(p.DEGREES);
    p.colorMode(p.RGB, 255);

    p.strokeCap(p.SQUARE);
    p.strokeJoin(p.MITER);

    seedList.add(PARAMS.seed);
    resetDrawingWithSeed(PARAMS.seed);

    p.frameRate(FPS);

    if (!EXPORTVIDEO && !PARAMS.isAnimated) p.noLoop();
  };

  const lineA = (x1, y1, x2, y2) => {
    const offsetSize = p.drawingContext.lineWidth;
    // Vertical line
    if (x1 === x2) {
      // Split it into two lines and offset one of them
      let ymid1 = p.lerp(y1, y2, utils.randBetween(0.2, 0.8));
      let xoffsets = [
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
      ];

      // Draw each segment
      p.line(x1 + xoffsets[0], y1, x2 + xoffsets[0], ymid1);
      p.line(x1 + xoffsets[1], ymid1, x2 + xoffsets[1], y2);
    }

    // Horizontal line
    if (y1 === y2) {
      // Split it into two lines and offset one of them
      let xmid1 = p.lerp(x1, x2, utils.randBetween(0.2, 0.8));
      let yoffsets = [
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
      ];

      // Draw each segment
      p.line(x1, y1 + yoffsets[0], xmid1, y2 + yoffsets[0]);
      p.line(xmid1, y1 + yoffsets[1], x2, y2 + yoffsets[1]);
    }
  };
  const lineB = (x1, y1, x2, y2) => {
    const offsetSize = p.drawingContext.lineWidth;
    // Vertical line
    if (x1 === x2) {
      // Split it into two lines and offset one of them
      let ymid1 = p.lerp(y1, y2, utils.randBetween(0.2, 0.6));
      let ymid2 = p.lerp(ymid1, y2, utils.randBetween(0.2, 0.8));
      let xoffsets = [
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
      ];

      // Draw each segment
      p.line(x1 + xoffsets[0], y1, x2 + xoffsets[0], ymid1);
      p.line(x1 + xoffsets[1], ymid1, x2 + xoffsets[1], ymid2);
      p.line(x1 + xoffsets[2], ymid2, x2 + xoffsets[2], y2);
    }

    // Horizontal line
    if (y1 === y2) {
      // Split it into two lines and offset one of them
      let xmid1 = p.lerp(x1, x2, utils.randBetween(0.2, 0.6));
      let xmid2 = p.lerp(xmid1, x2, utils.randBetween(0.2, 0.8));
      let yoffsets = [
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
        0.5 * offsetSize * (utils.randBoolean() ? 1 : -1),
      ];

      // Draw each segment
      p.line(x1, y1 + yoffsets[0], xmid1, y2 + yoffsets[0]);
      p.line(xmid1, y1 + yoffsets[1], xmid2, y2 + yoffsets[1]);
      p.line(xmid2, y1 + yoffsets[2], x2, y2 + yoffsets[2]);
    }
  };
  const lineC = (x1, y1, x2, y2) => {
    const offsetSize = p.drawingContext.lineWidth;
    // Vertical line
    if (x1 === x2) {
      // Split it into two lines and offset one of them
      let ymid1 = p.lerp(y1, y2, 0.8 * Math.abs(Math.cos((((0.5 * x1) / p.width) * 360 * Math.PI) / 180)));
      let ymid2 = p.lerp(y1, y2, Math.abs(Math.sin((2 * x2 * Math.PI) / 180)));
      [ymid1, ymid2] = [Math.min(ymid1, ymid2), Math.max(ymid1, ymid2)];
      let xoffsets = [0, offsetSize * (utils.randBoolean() ? 1 : 1), 0];

      // Draw each segment
      p.line(x1 + xoffsets[0], y1, x2 + xoffsets[0], ymid1);
      p.line(x1 + xoffsets[1], ymid1, x2 + xoffsets[1], ymid2);
      p.line(x1 + xoffsets[2], ymid2, x2 + xoffsets[2], y2);
    }

    // Horizontal line
    if (y1 === y2) {
      // Split it into two lines and offset one of them
      let xmid1 = p.lerp(x1, x2, utils.randBetween(0.2, 0.6));
      let xmid2 = p.lerp(xmid1, x2, utils.randBetween(0.2, 0.8));
      let yoffsets = [0, offsetSize * (utils.randBoolean() ? 1 : -1), 0];

      // Draw each segment
      p.line(x1, y1 + yoffsets[0], xmid1, y2 + yoffsets[0]);
      p.line(xmid1, y1 + yoffsets[1], xmid2, y2 + yoffsets[1]);
      p.line(xmid2, y1 + yoffsets[2], x2, y2 + yoffsets[2]);
    }
  };
  p.draw = () => {
    // p.background(194, 184, 149);
    // p.background(242, 234, 203);
    p.background("#272744");

    // DO YOUR DRAWING HERE!
    p.noFill();
    // p.strokeWeight(utils.pick([3, 4, 5]));
    p.strokeWeight(utils.pick([2, 3]));

    const fillBoxWithLines = (x: number, y: number, w: number, h: number, options?: Object) => {
      const steps = options?.steps ?? 4;
      const rotateIt = options?.rotateIt ?? false;

      // p.stroke(...utils.pick(colours));
      if (rotateIt) {
        for (let step = 0; step < steps; step++) {
          const xOffset = step * Math.floor(w / steps);
          lineC(x + xOffset, y, x + xOffset, y + h);
        }
      } else {
        for (let step = 0; step < steps; step++) {
          const yOffset = step * Math.floor(h / steps);
          lineC(x, y + yOffset, x + w, y + yOffset);
        }
      }
    };

    // const lineCountOpts = [3, 5, 7];
    const lineCountOpts = [7, 9, 11, 13];
    const rows = utils.pick([5, 7, 9, 11]),
      rowHeight = p.height / rows;
    const cols = utils.pick([7, 9, 11]),
      colWidth = p.width / cols;
    const inset = 1;
    for (let row = inset; row < rows - inset; row++) {
      p.stroke(utils.pick(colours));
      // p.stroke(colours[row % colours.length]);
      for (let col = inset; col < cols - inset; col++) {
        // p.stroke(colours[(col) % colours.length]);
        const rotateIt = utils.randBoolean();
        fillBoxWithLines(col * colWidth, row * rowHeight, colWidth, rowHeight, {
          // steps: utils.randBetween(4, 24, true),
          steps: utils.pick(lineCountOpts),
          // rotateIt,
          // rotateIt: false,
          rotateIt: utils.randBoolean(0.995),
        });
      }
    }

    // if (EXPORTVIDEO) {
    //   if (PARAMS.renderAsVector) throw new Error("Cannot export video when rendering as Vector");
    //   if (!isRecording) {
    //     isRecording = true;
    //     console.log("Recording...[ Not implemented ]");
    //   }
    //   // Example to end automatically after 361 frames to get a full loop
    //   if (p.frameCount > DURATION) {
    //     p.noLoop();
    //     saveConfig();
    //     console.log("Done.");
    //   }
    // }
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
  p.keyReleased = (e: KeyboardEvent) => {
    if (e.key === "s" || e.key === "S") {
      downloadOutput("png");
    } else if (e.key === "n" || e.key === "N") {
      // Generate a lovely new random seed to smash up and reseed with!
      let t_seed: string = Math.seedrandom();
      // Convert the fresh seed to happy little characters that play nice...
      t_seed = window.btoa(t_seed);
      // Then truncate the heck out of it...
      t_seed = t_seed.substring(0, 32);
      /// ...save it for record keeping...
      PARAMS.seed = t_seed;
      console.log(PARAMS.seed);
      // ... and feed it back in as a fresh seed!
      seedList.add(PARAMS.seed);
      resetDrawingWithSeed(PARAMS.seed);
      p.redraw();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      /// Get the next seed in the list
      PARAMS.seed = seedList.next();
      console.log(PARAMS.seed);
      // ... and feed it back in as a fresh seed!
      resetDrawingWithSeed(PARAMS.seed);
      p.redraw();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      /// Get the next seed in the list
      PARAMS.seed = seedList.previous();
      console.log(PARAMS.seed);
      // ... and feed it back in as a fresh seed!
      resetDrawingWithSeed(PARAMS.seed);
      p.redraw();
    }
  };
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
