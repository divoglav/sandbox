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

ivec4 getNeighbor(ivec2 offset) {
  return texelFetch(u_inputTextureIndex, ivec2(gl_FragCoord.xy) + offset, 0);
}
bool isAtPointer() {
  return distance(u_pointerPosition, v_coordinates) < POINTER_AREA;
}
// state = u_partition ? 1.0 : 0.0;

ivec2 getBlockCoordinates(ivec2 cellCoordinates, bool alteration) {
  return (alteration ? cellCoordinates + 1 : cellCoordinates) / 2;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  ivec2 block = getBlockCoordinates(cell, true);
  ivec4 eastNeighbor = getNeighbor(ivec2(1, 0));

  ivec4 inputData = texelFetch(u_inputTextureIndex, cell, 0);
  int state = inputData.r;
  int g = inputData.g;
  int b = inputData.b;
  int a = inputData.a;

  if(cell.x == 5 && cell.y == 4) state = 2;
  if(block.x == 1 && block.y == 1) state = 2;

  if(isAtPointer()) {
    if(eastNeighbor.r == 0) state = 3;
    else state = 4;
  }

  outData = ivec4(state, 0, 0, 0);
}




























