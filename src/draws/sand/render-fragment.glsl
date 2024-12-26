#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D u_newTextureIndex;

flat in vec2 v_coordinates;

void main() {
  vec3 nextData = texture(u_newTextureIndex, v_coordinates).rgb;

  float isUpdated = nextData.r;
  float type = nextData.g;
  float time = nextData.b;

  if(type > 0.0)
    outColor = vec4(1.0, 1.0, 1.0, 1.0) * 0.5;
  else
    outColor = vec4(1.0, 1.0, 1.0, 1.0) * 0.2;
}
