#version 300 es
precision highp float;

in vec2 v_coordinates;

out vec4 outData;

uniform sampler2D u_oldTextureIndex;

void main() {
  vec3 firstData = texture(u_oldTextureIndex, v_coordinates).rgb;

  float isUpdated = firstData.r;
  float type = firstData.g;
  float time = firstData.b;

  outData = vec4(
    isUpdated,
    type,
    time,
    0
  );
}
