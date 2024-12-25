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
  vec3 color = vec3(1.0, 1.0, 1.0) * 1.0;
  outColor = vec4(color, 1.0);
}
