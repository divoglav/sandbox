#version 300 es
precision highp float;

out vec4 outColor;

flat in vec2 v_coordinates;

uniform sampler2D u_newTextureIndex;
uniform SharedStaticData {
  float EMPTY;
  float BLOCK;
  float SAND;
};
uniform RenderStaticData {
  float width;
  float height;
  float pointSize;
  float brightness;

  vec3 colorError;
  vec3 colorEmpty;
  vec3 colorBlock;
  vec3 colorSand;
};

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
