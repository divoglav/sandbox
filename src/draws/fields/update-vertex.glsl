#version 300 es

in vec2  a_currentPosition;
in vec2  a_originalPosition;

out vec2 newPosition;

uniform vec2 u_pointerPosition;
uniform float u_deltaTime;
uniform GlobalStaticData {
  float u_brightness;
  float u_speed;
  float u_minSize;
  float u_sizeScalar;
};

const vec2 ZERO = vec2(0.0, 0.0);
const vec2 NEGATIVE_ONE = vec2(-1.0, -1.0);
const vec2 POSITIVE_ONE = vec2(1.0, 1.0);

const float ORIGIN_PULL_SCALAR = 0.8;

// const float MAX_REPEL_EFFECT_DISTANCE = 0.03;
const float MAX_REPEL_EFFECT_DISTANCE = 0.05;
const float REPEL_SCALAR = 0.2;
const float REPEL_NEAREST_SCALAR = 5.0;

vec2 originPull(vec2 position, vec2 origin) {
  return -1.0 * ORIGIN_PULL_SCALAR * (position - origin);
}

vec2 repel(vec2 position, vec2 pointer) {
  float distanceToPointer = distance(position, pointer);

  if(distanceToPointer >= MAX_REPEL_EFFECT_DISTANCE)
    return ZERO;

  vec2 direction = normalize(position - pointer);

  float inverse = 1.0 / distanceToPointer;
  float repelByDistance = clamp(inverse, 1.0, 1.0 + REPEL_NEAREST_SCALAR);

  return REPEL_SCALAR * direction * repelByDistance;
}

void main() {
  vec2 velocity = ZERO;
  velocity += originPull(a_currentPosition, a_originalPosition);
  velocity += repel(a_currentPosition, u_pointerPosition);
  velocity = u_deltaTime * clamp(velocity, NEGATIVE_ONE, POSITIVE_ONE);

  newPosition = a_currentPosition + velocity;
}
