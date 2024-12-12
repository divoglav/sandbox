let outColor = null;
let gl_FragCoord = null;

const double = (src, across) => {
  return () => (outColor = src[gl_FragCoord.y * across + gl_FragCoord.x] * 2);
};

const mapDst = (dst, across, up, fn) => {
  for (let y = 0; y < up; y++) {
    for (let x = 0; x < across; x++) {
      gl_FragCoord = {x, y};
      fn();
      dst[y * across + x] = outColor;
    }
  }
};

const src = [1, 2, 3, 4, 5, 6];
const dst = new Array(6);
mapDst(dst, 3, 2, double(src, 3));

console.log(`src: ${src}`);
console.log(`dst: ${dst}`);
