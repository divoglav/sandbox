#version 300 es
precision highp float;

in vec2 v_coordinates;

out vec4 outData;

uniform sampler2D u_oldTextureIndex;
uniform vec2 u_pointerPosition;
uniform bool u_isPointerDown;
layout(std140) uniform TypesStaticData {
  float EMPTY;
  float BLOCK;
  float SAND;
  float padT0;
};

const ivec2 NORTH       = ivec2( 0,  1);
const ivec2 NORTH_EAST  = ivec2( 1,  1);
const ivec2 EAST        = ivec2( 1,  0);
const ivec2 SOUTH_EAST  = ivec2( 1, -1);
const ivec2 SOUTH       = ivec2( 0, -1);
const ivec2 SOUTH_WEST  = ivec2(-1, -1);
const ivec2 WEST        = ivec2(-1,  0);
const ivec2 NORTH_WEST  = ivec2(-1,  1);

const float POINTER_AREA = 0.05;

vec3 getNeighborData(ivec2 offset) {
  return texelFetch(u_oldTextureIndex, ivec2(gl_FragCoord.xy) + offset, 0).rgb;
}

bool isPointerHere() {
  return distance(u_pointerPosition, v_coordinates) < POINTER_AREA;
}

float doEmpty() {
  vec3 north     = getNeighborData(NORTH);
  vec3 northEast = getNeighborData(NORTH_EAST);
  vec3 east      = getNeighborData(EAST);

  if(north.g == SAND)
    return SAND;

  else if(northEast.g == SAND) {
    if(east.g == SAND) return SAND;
  }

  return EMPTY;
}

float doBlock() {
  return BLOCK;
}

float doSand() {
  vec3 south     = getNeighborData(SOUTH);
  vec3 southWest = getNeighborData(SOUTH_WEST);

  if(south.g == EMPTY)
    return EMPTY;

  else if(southWest.g == EMPTY)
    return EMPTY;

  return SAND;
}

void main() {
  vec3 firstData = texture(u_oldTextureIndex, v_coordinates).rgb;
  float isUpdated = firstData.r;
  float type      = firstData.g;
  float time      = firstData.b;
  // if(isUpdated) skip // ?
  // time++ // ?

  if      (type == EMPTY) type = doEmpty();
  else if (type == BLOCK) type = doBlock();
  else if (type == SAND)  type = doSand();

  if(u_isPointerDown && isPointerHere()) type = SAND;

  outData = vec4(isUpdated, type, time, 0);
}

// if I have this pattern:
//
// [ ][#][ ]
// [a][#][b]
