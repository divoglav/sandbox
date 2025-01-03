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

const int EMPTY = 0;
const int BLOCK = 1;
const int SAND  = 2;
const int WATER = 3;

const vec4 COLORS[4] = vec4[4](
  vec4(0.1,  0.1,  0.1,  1.0),  // 0
  vec4(0.5,  0.5,  0.5,  1.0),  // 1
  vec4(0.5,  0.5,  0.1,  1.0),  // 2
  vec4(0.0,  0.6,  0.3,  1.0)   // 3
);

void main() {
  ivec4 outputData = texelFetch(u_outputTextureIndex,
                                ivec2(v_coordinates * GRID_DIMENSIONS),
                                0);

  outColor = COLORS[outputData.r];
}
