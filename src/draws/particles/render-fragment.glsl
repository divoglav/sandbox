#version 300 es
precision highp float;

flat in vec3 v_texelColor;

out vec4 outColor;

void main() {
  const float brightness = 3.0;

  outColor = vec4(v_texelColor * brightness, 1.0);
}
