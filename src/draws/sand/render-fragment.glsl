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

const vec4 COLOR_ERROR = vec4(1.0,  0.0,  1.0,  1.0);
const vec4 COLOR_EMPTY = vec4(0.5,  0.5,  0.5,  1.0);
const vec4 COLOR_BLOCK = vec4(0.1,  0.1,  0.1,  1.0);
const vec4 COLOR_SAND  = vec4(0.75, 0.75, 0.5,  1.0);

const float BRIGHTNESS = 0.6;

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
