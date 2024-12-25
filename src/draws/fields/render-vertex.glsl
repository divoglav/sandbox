#version 300 es

in vec2 a_newPosition;

uniform GlobalStaticData {
  float u_brightness;
  float u_speed;
  float u_minSize;
  float u_sizeScalar;
};

void main() {
  gl_PointSize = 4.0;

  vec2 clipSpace = a_newPosition * 2.0 - 1.0;
  gl_Position = vec4(clipSpace, 0.0, 1.0);
}
