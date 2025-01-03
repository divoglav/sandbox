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

const float POINTER_AREA = 0.02;

// Neighbor Offsets.
const ivec2 NORTH      = ivec2(0,  1);
const ivec2 NORTH_EAST = ivec2(1,  1);
const ivec2 EAST       = ivec2(1,  0);

// Block Pattern Transforms.
const int identity[16] = int[16]( 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15);
const int clean[16]    = int[16]( 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0);
const int fill[16]     = int[16](15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15);
const int sand[16]     = int[16]( 0,  1,  2,  3,  1,  3,  3,  7,  2,  3,  3, 11,  3,  7, 11, 15);
const int tron[16]     = int[16](15,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,  0);

// Encodes 4 bits into a number [0 to 15].
int encodePattern(ivec4 cellStates) {
  return cellStates.r +       // R: bottom-left cell
         cellStates.g * 2 +   // G: bottom-right cell
         cellStates.b * 4 +   // B: top-left cell
         cellStates.a * 8;    // A: top-right cell
}

// Decodes a number [0 to 15] back to 4 bits.
ivec4 decodePattern(int pattern) {
  return ivec4(
     pattern       & 1,   // R: bottom-left cell
    (pattern >> 1) & 1,   // G: bottom-right cell
    (pattern >> 2) & 1,   // B: top-left cell
    (pattern >> 3) & 1    // A: top-right cell
  );
}

// Coordinates of a 2x2 margolus block.
ivec2 getBlock(ivec2 cellCoordinates) {
  return (u_partition ? cellCoordinates + 1 : cellCoordinates) / 2;
}

// The block index [0 to 3] of a cell.
int getInBlockIndex(ivec2 cell) {
  ivec2 partitionOffset = u_partition ? cell + 1 : cell;
  return (partitionOffset.x & 1) + 2 * (partitionOffset.y & 1);
}

// Texel data.
ivec4 getData(ivec2 cell) {
  return texelFetch(u_inputTextureIndex, cell, 0);
}

// The block pattern of cell types in 4 bits.
ivec4 getPattern(ivec2 block) {
  ivec2 cell = block * 2 - (u_partition ? 1 : 0);
  return ivec4(
    getData(cell             ).r,   // R: bottom-left cell
    getData(cell + EAST      ).r,   // G: bottom-right cell
    getData(cell + NORTH     ).r,   // B: top-left cell
    getData(cell + NORTH_EAST).r    // A: top-right cell
  );
}

bool isAtPointer() {
  return distance(u_pointerPosition, v_coordinates) < POINTER_AREA;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);

  // Bottom Wall
  if(cell.y == 0) {
    outData = ivec4(1, 0, 0, 0);
    return;
  }

  if(isAtPointer() && u_isPointerDown) {
    outData = ivec4(1, 0, 0, 0);
    return;
  }

  ivec4 inputData = getData(cell);
  int cellType = inputData.r;

  int oldPattern = encodePattern(getPattern(getBlock(cell)));
  int newPattern = sand[oldPattern];

  ivec4 decodedNewPattern = decodePattern(newPattern);
  cellType = decodedNewPattern[getInBlockIndex(cell)];

  outData = ivec4(cellType, 0, 0, 0);
}
