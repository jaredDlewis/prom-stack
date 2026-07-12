/* 
  Approach for integrating p5 into React taken from:
  https://dev.to/christiankastner/integrating-p5-js-with-react-i0d
  */

import { MEMORY_PERCENT, MEMORY_USAGE_DISPLAY } from './constants';

// Constants
const GROUND_HEIGHT = 50;
const GROUND_COLOR = 'lavender';
// box height needs to equal ground height until translate logic is added at the end of placeGround
// to move origin to correct position for the first new box to sit on top of the ground
const BOX_HEIGHT = GROUND_HEIGHT;
const INITIAL_CAMERA_Y = 200;
const INITIAL_CAMERA_Z = 800;

// Variables

export function getSketchFunc(stateRef) {
  function Sketch(p) {
    // Listeners

    p.setup = () => {
      p.createCanvas(0, 0, p.WEBGL);
      resizeToParent();
      p.camera(0, INITIAL_CAMERA_Y, INITIAL_CAMERA_Z);
      p.textAlign(p.CENTER, p.CENTER);
      p.loadFont(
        'SpaceMono-Bold.ttf',
        (font) => {
          p.textFont(font);
          p.textSize(16);
        },
        (error) => console.error(error),
      );
    };

    p.draw = () => {
      p.background(135, 206, 235);
      p.orbitControl(2.5, 2.5, 2.5);

      p.ambientLight(255, 255, 255);

      placeGround();
      /* fill ground with cpu level of outer container */
      // add a ground box that starts at the left of the current ground and overlaps the existing ground
      // its depth is the same as the ground
      // its width is proportional to the cpu percentage of the container
      // its color is yellow-red and proportional to the cpu percentage of the container

      // stack container memory boxes
      moveOriginToCenterOfGround(); // the boxes stack on the center of the ground
      stateRef.current.metrics.forEach((container, i) => {
        const proportion = container[MEMORY_PERCENT] / 100;
        const nestedLevel = stateRef.current.metrics.length - (i + 1);
        const memoryUsageTotalDisplay = container[MEMORY_USAGE_DISPLAY];
        placeBox(
          calcBoxWidth(proportion),
          calcBoxColor(proportion),
          getBoxText(nestedLevel, memoryUsageTotalDisplay),
        );
      });
    };

    p.windowResized = () => {
      p.resizeCanvas(0, 0);
      resizeToParent();
    };

    // Helpers

    const getBoxText = (nestedLevel, memoryUsageTotalDisplay) => {
      return `${nestedLevel}: ${memoryUsageTotalDisplay}`;
    };

    const calcBoxColor = (proportionMemory) => {
      return [255, 255 * (1 - proportionMemory), 0];
    };

    const calcBoxWidth = (proportionMemory) => {
      return p.width * proportionMemory;
    };

    const placeBox = (width, color, nestedLevel) => {
      p.translate(0, -(BOX_HEIGHT + 1), 0);
      p.ambientMaterial(color);
      p.box(width, BOX_HEIGHT, width);
      p.push();
      p.translate(0, 0, width / 2 + 1);
      p.text(nestedLevel, 0, 0);
      p.pop();
    };

    const moveOriginToCenterOfGround = () => {
      p.resetMatrix();
      p.translate(0, (p.height - GROUND_HEIGHT) / 2, -(p.width / 2));
    };

    const placeGround = () => {
      moveOriginToCenterOfGround();
      p.ambientMaterial(GROUND_COLOR);
      p.box(p.width, GROUND_HEIGHT, p.width);
    };

    const resizeToParent = () => {
      if (p.canvas && p.canvas.parentElement) {
        const parent = p.canvas.parentElement;
        // Get the exact pixel dimensions of the parent div
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        p.resizeCanvas(width, height);
        placeGround();
      }
    };
  }

  return Sketch;
}
