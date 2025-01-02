#version 300 es
precision highp int;
precision highp float;
precision highp isampler2D;

in vec2 v_coordinates;

out ivec4 outData;

uniform isampler2D u_inputTextureIndex;
uniform bool u_partition;
uniform bool u_isPointerDown;
uniform vec2 u_pointerPosition;

const float POINTER_AREA = 0.05;

const ivec2 NORTH      = ivec2( 0,  1);
const ivec2 NORTH_EAST = ivec2( 1,  1);
const ivec2 EAST       = ivec2( 1,  0);
const ivec2 SOUTH_EAST = ivec2( 1, -1);
const ivec2 SOUTH      = ivec2( 0, -1);
const ivec2 SOUTH_WEST = ivec2(-1, -1);
const ivec2 WEST       = ivec2(-1,  0);
const ivec2 NORTH_WEST = ivec2(-1,  1);

const int NONE = 0;
const int CELL = 1;
const int RED = 2;
const int GREEN = 3;
const int BLUE = 4;
const int YELLOW = 5;

const int identity[16] = int[16]( 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15);
const int clean[16]    = int[16]( 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0);
const int fill[16]     = int[16](15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15);
const int sand[16]     = int[16]( 0,  1,  2,  3,  1,  3,  3,  7,  2,  3,  1, 11,  3,  7, 11, 15);

const ivec2 DIMENSIONS = ivec2(100, 100);

int encodeBlockPattern(ivec4 cellStates) {
  return cellStates.r +       // R: bottom-left cell
         cellStates.g * 2 +   // G: bottom-right cell
         cellStates.b * 4 +   // B: top-left cell
         cellStates.a * 8;    // A: top-right cell
}

ivec4 decodeBlockPattern(int pattern) {
  return ivec4(
     pattern       & 1,   // R: bottom-left cell
    (pattern >> 1) & 1,   // G: bottom-right cell
    (pattern >> 2) & 1,   // B: top-left cell
    (pattern >> 3) & 1    // A: top-right cell
  );
}

ivec2 getBlock(ivec2 cellCoordinates, bool alteration) {
  return (alteration ? cellCoordinates + 1 : cellCoordinates) / 2;
}

int getInBlockIndex(ivec2 cell, bool alteration) {
  ivec2 alteredCell = alteration ? cell + 1 : cell;
  return (alteredCell.x & 1) + 2 * (alteredCell.y & 1);
}

ivec4 getData(ivec2 cell) {
  return texelFetch(u_inputTextureIndex, cell, 0);
}

ivec4 getBlockPattern(ivec2 block, bool alteration) {
  // TODO: plus or minus for the alteration?
  ivec2 cell = block * 2 - (alteration ? 1 : 0);
  return ivec4(
    getData(cell             ).r,   // R: bottom-left cell
    getData(cell + EAST      ).r,   // G: bottom-right cell
    getData(cell + NORTH     ).r,   // B: top-left cell
    getData(cell + NORTH_EAST).r    // A: top-right cell
  );
}

// bool isWall(ivec2 cell) {
//   return cell.x == 0 && 
// }

bool isAtPointer() {
  return distance(u_pointerPosition, v_coordinates) < POINTER_AREA;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);

  ivec4 inputData = getData(cell);
  int state = inputData.r;

  if(cell.y == 0) {
    outData = ivec4(state, 0, 0, 0);
    return;
  }

  bool alteration = u_partition;

  ivec2 block = getBlock(cell, alteration);

  ivec4 blockPattern = getBlockPattern(block, alteration);

  int encodedPattern = encodeBlockPattern(blockPattern);

  int newBlockPattern = sand[encodedPattern];

  ivec4 decodedNewBlockPattern = decodeBlockPattern(newBlockPattern);

  int inNewBlockIndex = getInBlockIndex(cell, alteration);

  state = decodedNewBlockPattern[inNewBlockIndex];

  outData = ivec4(state, 0, 0, 0);
}
