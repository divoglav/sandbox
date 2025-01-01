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

ivec2 getBlock(ivec2 cellCoordinates, bool alteration) {
  return (alteration ? cellCoordinates + 1 : cellCoordinates) / 2;
}

// ivec2 getBlock(ivec2 cellCoordinates) {
//   return cellCoordinates / 2;
// }

int getInBlockIndex(ivec2 cell, bool alteration) {
  ivec2 alteredCell = alteration ? cell + 1 : cell;

  return (alteredCell.x % 2) + 2 * (alteredCell.y % 2);
}

ivec4 getData(ivec2 cell) {
  return texelFetch(u_inputTextureIndex, cell, 0);
}

bool isAtPointer() {
  return distance(u_pointerPosition, v_coordinates) < POINTER_AREA;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);

  ivec4 inputData = getData(cell);
  int state = inputData.r;
  int g = inputData.g;
  int b = inputData.b;
  int a = inputData.a;

  const bool alteration = false;

  ivec2 block = getBlock(cell, alteration);
  // ivec2 block = getBlock(cell);

  // state = 0;
  // if(cell.x == 5 && cell.y == 4) state = 2;
  // if(block.x == 1 && block.y == 1) state = 2;

  if(block.x == 1 && block.y == 1) {
    state = 2;
    if(getInBlockIndex(cell, alteration) == 0) state = 3;
  }

  outData = ivec4(state, 0, 0, 0);
}
