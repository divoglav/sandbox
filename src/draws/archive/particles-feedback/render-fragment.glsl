#version 300 es
precision highp float;

flat in vec3 v_texel;

out vec4 outColor;

void main() {
  const float brightness = 4.0;

  outColor = vec4(v_texel * brightness, 1.0);
}
