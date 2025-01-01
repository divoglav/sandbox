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
const vec4 COLOR_RED = vec4(0.5,  0.0,  0.0,  1.0);
const vec4 COLOR_GREEN = vec4(0.0,  0.5,  0.0,  1.0);
const vec4 COLOR_BLUE = vec4(0.0,  0.0,  0.5,  1.0);
const vec4 COLOR_YELLOW = vec4(0.5,  0.5,  0.0,  1.0);

const int NONE = 0;
const int CELL = 1;
const int RED = 2;
const int GREEN = 3;
const int BLUE = 4;
const int YELLOW = 5;

void main() {
  ivec4 outputData = texelFetch(u_outputTextureIndex, ivec2(v_coordinates * GRID_DIMENSIONS), 0);

  int state = outputData.r;

  switch(state) {
    case NONE: outColor = COLOR_NONE;
    break;
    case CELL: outColor = COLOR_CELL;
    break;
    case RED: outColor = COLOR_RED;
    break;
    case GREEN: outColor = COLOR_GREEN;
    break;
    case BLUE: outColor = COLOR_BLUE;
    break;
    case YELLOW: outColor = COLOR_YELLOW;
    break;
  }
}
