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

const int ELEMENTS_COUNT = 5;

const int EMPTY = 0;
const int BLOCK = 1;
const int SAND  = 2;
const int WATER = 3;
const int FIRE  = 4;

// Block Pattern Transforms.
const int INTERACTIONS[10 * 16] = int[10 * 16](
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // EMPTY - BLOCK
  0,  1,  2,  3,  1,  3,  3,  7,  2,  3,  3, 11,  3,  7, 11, 15, // EMPTY - SAND 
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // EMPTY - WATER
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // EMPTY - FIRE
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // BLOCK - SAND
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // BLOCK - WATER
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // BLOCK - FIRE
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // SAND  - WATER
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, // SAND  - FIRE
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15  // WATER - FIRE
);

int getInteractionsKey(int e1, int e2) {
  return 16 * (e1 * (ELEMENTS_COUNT - 1) - (e1 * (e1 + 1)) / 2 + e2 - e1 - 1);
}

int encodePattern(ivec4 cellStates) {
  // Encodes 4 bits into a number [0 to 15].
  return cellStates.r +       // R: bottom-left cell
         cellStates.g * 2 +   // G: bottom-right cell
         cellStates.b * 4 +   // B: top-left cell
         cellStates.a * 8;    // A: top-right cell
}

ivec4 decodePattern(int pattern) {
  // Decodes a number [0 to 15] back to 4 bits.
  return ivec4(
     pattern       & 1,   // R: bottom-left cell
    (pattern >> 1) & 1,   // G: bottom-right cell
    (pattern >> 2) & 1,   // B: top-left cell
    (pattern >> 3) & 1    // A: top-right cell
  );
}

ivec2 getBlock(ivec2 cellCoordinates) {
  // Coordinates of a 2x2 margolus block.
  return (u_partition ? cellCoordinates + 1 : cellCoordinates) / 2;
}

int getInBlockIndex(ivec2 cell) {
  // The block index [0 to 3] of a cell.
  ivec2 partitionOffset = u_partition ? cell + 1 : cell;
  return (partitionOffset.x & 1) + 2 * (partitionOffset.y & 1);
}

ivec4 getData(ivec2 cell) {
  // Texel data.
  return texelFetch(u_inputTextureIndex, cell, 0);
}

// TODO:
ivec4 getBlockElements(ivec2 block) {
  // The block pattern of cell types in 4 bits.
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

ivec2 getUniqueElements(ivec4 elements) {
  // Returns the two unique elements in ascending order.
  int one = elements.r;
  int two = (elements.g != one) ? elements.g : (elements.b != one) ? elements.b : elements.a;
  return one < two ? ivec2(one, two) : ivec2(two, one);
}

ivec4 mapToBitRange(ivec4 vector, int smaller) {
  // Maps the ivec4 of two elements into the 0-1 range.
  return ivec4(
    vector.r != smaller,
    vector.g != smaller,
    vector.b != smaller,
    vector.a != smaller
  );
}

ivec4 mapFromBitRange(ivec4 bitRange, ivec2 values) {
  // Maps a bitRange ivec4 of two elements into the values range.
  return ivec4(values.x) + bitRange * (values.y - values.x);
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

  ivec2 block = getBlock(cell);
  ivec4 elements = getBlockElements(block);

  int uniqueElementsCount = countUniqueElements(elements);

  if(uniqueElementsCount == 1) {
    outData = inputData;
    return;
  }

  if(uniqueElementsCount == 2) {
    ivec2 uniqueElements = getUniqueElements(elements);

    int lookupKey = getInteractionsKey(uniqueElements.x, uniqueElements.y);

    ivec4 bitRange = mapToBitRange(elements, uniqueElements.x);

    if(bitRange.y == 2) {
      outData = ivec4(-1, inputData.gba);
      return;
    }

    // int oldPattern = encodePattern(getPattern(block));
    int oldPattern = encodePattern(bitRange);
    int newPattern = INTERACTIONS[lookupKey + oldPattern];

    ivec4 decodedNewPattern = decodePattern(newPattern);
    ivec4 asd = mapFromBitRange(decodedNewPattern, uniqueElements);

    int newElement = asd[getInBlockIndex(cell)];

    outData = ivec4(newElement, inputData.gba);
    return;
  }

  outData = inputData;
}


