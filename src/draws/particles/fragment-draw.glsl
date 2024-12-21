#version 300 es
precision highp float;

in vec2 v_position;

out vec4 outColor;

void main() {
  outColor = vec4(v_position.xy / 2.0 + 1.0, 0, 1);
  // outColor = vec4(1.0, 0, 0, 1);
}
