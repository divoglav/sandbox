#version 300 es
precision highp int;
precision highp float;
precision highp isampler2D;

in vec2 v_coordinates;

out ivec4 outData;

uniform isampler2D u_inputTextureIndex;
uniform int u_inputKey;
uniform bool u_partition;
uniform bool u_isPointerDown;
uniform vec2 u_pointerPosition;

const float POINTER_AREA = 0.03;

// Neighbor Offsets.
const ivec2 NORTH      = ivec2(0,  1);
const ivec2 NORTH_EAST = ivec2(1,  1);
const ivec2 EAST       = ivec2(1,  0);

const int EMPTY = 0;
const int BLOCK = 1;
const int SAND  = 2;
const int WATER = 3;

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

// TODO:
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

// TODO:
// The block pattern of cell types in 4 bits.
ivec4 getBlockElements(ivec2 block) {
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

int countUniqueElements(ivec4 elements) {
  int uniqueCount = 1;

  bool e1 = elements[1] != elements[0];
  bool e2 = elements[2] != elements[0] && elements[2] != elements[1];
  bool e3 = elements[3] != elements[0] && elements[3] != elements[1] && elements[3] != elements[2];

  uniqueCount += int(e1) + int(e2) + int(e3);

  return uniqueCount;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);

  // Bottom Wall
  if(cell.y == 0) {
    outData = ivec4(1, 0, 0, 0);
    return;
  }

  // Input Spawn
  if(u_inputKey > -1 && isAtPointer()) {
    outData = ivec4(u_inputKey, 0, 0, 0);
    return;
  }

  ivec4 inputData = getData(cell);
  int cellElement = inputData.r;

  ivec2 block = getBlock(cell);
  ivec4 elements = getBlockElements(block);

  int uniqueElementsCount = countUniqueElements(elements);

  if(uniqueElementsCount == 1) {
    outData = inputData;
  }
  else if(uniqueElementsCount == 2) {
    int oldPattern = encodePattern(getPattern(block));
    int newPattern = sand[oldPattern];

    ivec4 decodedNewPattern = decodePattern(newPattern);
    cellElement = decodedNewPattern[getInBlockIndex(cell)];

    outData = ivec4(cellElement, inputData.gba);
  }
}
