#version 300 es
precision highp float;

#define PI radians(180.0)
#define TAU radians(360.0)

const vec2 DIMENSIONS = vec2(0.0, 1.0);

in vec2 v_coordinates;

out vec4 outData;

uniform sampler2D u_oldTextureIndex;

vec2 warp(vec2 coordinates) {
  vec2 warped = coordinates;

  if(warped.x >= DIMENSIONS.y) {
    warped.x = DIMENSIONS.x;
  } else if (warped.x <= DIMENSIONS.x) {
    warped.x = DIMENSIONS.y;
  }

  if(warped.y >= DIMENSIONS.y) {
    warped.y = DIMENSIONS.x;
  } else if (warped.y <= DIMENSIONS.x) {
    warped.y = DIMENSIONS.y;
  }

  return warped;
}

void main() {
  vec3 firstData = texture(u_oldTextureIndex, v_coordinates).rgb;

  vec2 position = firstData.xy;
  float angle = firstData.z * TAU;

  const float speed = 0.01;

  vec2 velocity = vec2(
    cos(angle) * speed,
    sin(angle) * speed
  );

  position += velocity;

  position = warp(position);

  outData = vec4(
    position,
    firstData.z,
    1.0
  );
}
