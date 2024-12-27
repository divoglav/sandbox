#version 300 es
precision highp float;

out vec4 outColor;

flat in vec2 v_coordinates;

uniform sampler2D u_newTextureIndex;
layout(std140) uniform TypesStaticData {
  float EMPTY;
  float BLOCK;
  float SAND;
  float padT0;
};
layout(std140) uniform ColorsStaticData {
  vec4 COLOR_ERROR;
  vec4 COLOR_EMPTY;
  vec4 COLOR_BLOCK;
  vec4 COLOR_SAND;
};
layout(std140) uniform MiscStaticData {
  float BRIGHTNESS;
  float POINTER_AREA;
  float padM0;
  float padM1;
};

void main() {
  vec3 nextData = texture(u_newTextureIndex, v_coordinates).rgb;
  float isUpdated = nextData.r;
  float type = nextData.g;
  float time = nextData.b;

  if(type == EMPTY)
    outColor = COLOR_EMPTY * BRIGHTNESS;
  else if(type == BLOCK)
    outColor = COLOR_BLOCK * BRIGHTNESS;
  else if(type == SAND)
    outColor = COLOR_SAND  * BRIGHTNESS;
  else
    outColor = COLOR_ERROR * BRIGHTNESS;
}
