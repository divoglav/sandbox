#version 300 es

const vec2 DIMENSIONS = vec2(-1.0, 1.0);

in vec2 a_oldPosition;
in vec2 a_velocity;

uniform float u_deltaTime;

out vec2 newPosition;

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
  newPosition = a_oldPosition + a_velocity * u_deltaTime;

  newPosition = warp(newPosition);
}
