#version 300 es

flat out vec2 v_coordinates;

layout(std140) uniform DimensionsStaticData {
  float WIDTH;
  float HEIGHT;
  float CANVAS_WIDTH;
  float CANVAS_HEIGHT;
};

vec2 getCoordinates(float id) {
  float xIndex = mod(id, WIDTH);
  float yIndex = floor(id / WIDTH);
  return vec2((xIndex + 0.5) / WIDTH, (yIndex + 0.5) / HEIGHT);
}

void main() {
  vec2 point = getCoordinates(float(gl_VertexID));

  vec2 clipSpace = point * 2.0 - 1.0;
  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = 800.0 / WIDTH - 0.5;

  v_coordinates = point;
}
