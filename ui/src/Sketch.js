/* 
  Approach for integrating p5 into React taken from:
  https://dev.to/christiankastner/integrating-p5-js-with-react-i0d
*/
export const Sketch = (p) => {
  p.setup = () => {
    p.createCanvas(300, 200);
    p.noStroke();
  };

  p.draw = () => {
    p.background('orangered');
    p.ellipse(150, 100, 100, 100);
  };
};
