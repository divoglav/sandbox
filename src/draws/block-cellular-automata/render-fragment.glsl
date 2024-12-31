#version 300 es
precision highp int;
precision highp float;
precision highp isampler2D;

out vec4 outColor;

flat in vec2 v_coordinates;

uniform isampler2D u_outputTextureIndex;
layout(std140) uniform DimensionsStaticData {
  vec2 GRID_DIMENSIONS;
  vec2 CANVAS_DIMENSIONS;
};

const vec4 COLOR_NONE = vec4(0.1,  0.1,  0.1,  1.0);
const vec4 COLOR_CELL = vec4(0.4,  0.4,  0.4,  1.0);

void main() {
  ivec4 outputData = texelFetch(u_outputTextureIndex, ivec2(v_coordinates * GRID_DIMENSIONS), 0);

  int state = outputData.r;

  outColor = COLOR_NONE;

  if(state == 1)
    outColor = COLOR_CELL;

  if(state == 2)
    outColor = vec4(0.0, 0.5, 0.0, 1.0);

  if(state == 3)
    outColor = vec4(0.5, 0.5, 0.0, 1.0);

  if(state == 4)
    outColor = vec4(0.5, 0.0, 0.0, 1.0);
}
