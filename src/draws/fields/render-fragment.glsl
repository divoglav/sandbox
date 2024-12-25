#version 300 es
precision highp float;

out vec4 outColor;

uniform GlobalStaticData {
  float u_brightness;
  float u_speed;
  float u_minSize;
  float u_sizeScalar;
};

void main() {
  outColor = vec4(0.5, 0.5, 0.5, 1.0);
}
