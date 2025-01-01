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

const int identity[16] = int[16](0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

int encodeBlockStates(ivec4 cellStates) {
  return cellStates.r +       // R: bottom-left cell
         cellStates.g * 2 +   // G: bottom-right cell
         cellStates.b * 4 +   // B: top-left cell
         cellStates.a * 8;    // A: top-right cell
}

ivec4 decodeBlockStates(int state) {
  return ivec4(
     state       & 1,   // R: bottom-left cell
    (state >> 1) & 1,   // G: bottom-right cell
    (state >> 2) & 1,   // B: top-left cell
    (state >> 3) & 1    // A: top-right cell
  );
}

ivec2 getBlock(ivec2 cellCoordinates, bool alteration) {
  return (alteration ? cellCoordinates + 1 : cellCoordinates) / 2;
}

int getInBlockIndex(ivec2 cell, bool alteration) {
  ivec2 alteredCell = alteration ? cell + 1 : cell;
  // Better than: (alteredCell.x % 2) + 2 * (alteredCell.y % 2);
  return (alteredCell.x & 1) + 2 * (alteredCell.y & 1);
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

  const bool alteration = true;

  ivec2 block = getBlock(cell, alteration);
  int inBlockIndex = getInBlockIndex(cell, alteration);

  if(block == ivec2(1, 1)) {
    state = YELLOW;

    if(inBlockIndex == 0)
      state = RED;
  }


  int blockStates[4];
  // blockStates[0] = getData()

  outData = ivec4(state, 0, 0, 0);
}
