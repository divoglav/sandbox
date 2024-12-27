#version 300 es
precision highp float;

in vec2 v_coordinates;

out vec4 outData;

uniform sampler2D u_oldTextureIndex;

uniform SharedStaticData {
  float EMPTY;
  float BLOCK;
  float SAND;
};
uniform UpdateStaticData {
  vec2 NORTH;
  vec2 NORTH_EAST;
  vec2 EAST;
  vec2 SOUTH_EAST;
  vec2 SOUTH;
  vec2 SOUTH_WEST;
  vec2 WEST;
  vec2 NORTH_WEST;
};

vec3 getNeighborData(vec2 offset) {
  return texture(u_oldTextureIndex, v_coordinates + offset).rgb;
}

float onEmpty() {
  vec3 north = getNeighborData(NORTH);
  if(north.g == SAND) return SAND;
  return EMPTY;
}

float onBlock() {
  return BLOCK;
}

float onSand() {
  vec3 south = getNeighborData(SOUTH);
  if(south.g == EMPTY) return EMPTY;
  return SAND;
}

void main() {
  vec3 firstData = texture(u_oldTextureIndex, v_coordinates).rgb;
  float isUpdated = firstData.r;
  float type      = firstData.g;
  float time      = firstData.b;

  // if(isUpdated) skip // ?
  // time++ // ?

  if      (type == EMPTY) type = onEmpty();
  else if (type == BLOCK) type = onBlock();
  else if (type == SAND)  type = onSand();

  outData = vec4(
    isUpdated,
    type,
    time,
    0
  );
}
