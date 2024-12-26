#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D u_newTextureIndex;

flat in vec2 v_coordinates;

// TODO: uniform block
const float brightness = 0.6;

const vec3 colorEmpty  = vec3(0.5, 0.5, 0.5);
const vec3 colorBlock  = vec3(0.1, 0.1, 0.1);
const vec3 colorSand   = vec3(0.75, 0.7, 0.5);
const vec3 colorError  = vec3(1.0, 0.0, 1.0);

// readability
const float byteFloat = 1.0 / 255.0;

const float EMPTY = byteFloat * 0.0;
const float BLOCK = byteFloat * 1.0;
const float SAND  = byteFloat * 2.0;
//

void main() {
  vec3 nextData = texture(u_newTextureIndex, v_coordinates).rgb;

  float isUpdated = nextData.r;
  float type = nextData.g;
  float time = nextData.b;

  if(type == EMPTY)
    outColor = vec4(colorEmpty, 1.0) * brightness;
  else if(type == BLOCK)
    outColor = vec4(colorBlock, 1.0) * brightness;
  else if(type == SAND)
    outColor = vec4(colorSand,  1.0) * brightness;
  else
    outColor = vec4(colorError, 1.0) * brightness;
}
